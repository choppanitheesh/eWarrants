import { useState, useCallback, useRef } from "react";
import { Platform, Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import apiClient from "../api";
import { useDatabase } from "../contexts/DatabaseContext";
import { useNetInfo } from "@react-native-community/netinfo";
import Toast from "react-native-toast-message";
import { pushChangesToServer, pullChangesFromServer } from "../sync";

export const useWarrantyForm = () => {
  const bottomSheetRef = useRef(null);
  const database = useDatabase();
  const netInfo = useNetInfo();

  const [productName, setProductName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const clearForm = useCallback(() => {
    setProductName("");
    setPurchaseDate(new Date());
    setWarrantyMonths("");
    setCategory("");
    setDescription("");
    setReceipts([]);
  }, []);

  const handleOpenSheet = () => bottomSheetRef.current?.expand();
  const handleCloseSheet = () => bottomSheetRef.current?.close();

  const handleStartAddFlow = useCallback(async () => {
    if (netInfo.isConnected === false) {
      Toast.show({
        type: "info",
        text1: "Offline Mode",
        text2: "Please enter details manually.",
      });
      clearForm();
      handleOpenSheet();
      return;
    }

    if (netInfo.isConnected === true) {
      const { status } = await ImagePicker.getMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        const { status: newStatus } =
          await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (newStatus !== "granted") {
          Alert.alert(
            "Permission Required",
            "You need to allow access to your photo library to select a receipt."
          );
          return;
        }
      }

      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          // --- THIS IS THE FIX ---
          // Reverted to the older, compatible syntax for your project
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.7,
        });

        if (result.canceled) {
          Toast.show({
            type: "info",
            text1: "Manual Entry",
            text2: "You can add details for your warranty here.",
          });
          clearForm();
          handleOpenSheet();
          return;
        }

        const image = result.assets[0];
        setIsProcessing(true);
        const formData = new FormData();
        formData.append("receipt", {
          uri: image.uri,
          name: "receipt.jpg",
          type: "image/jpeg",
        });

        const response = await apiClient.post("/process-receipt", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = response.data;
        setProductName(data.productName || "");
        if (data.purchaseDate) setPurchaseDate(new Date(data.purchaseDate));
        setWarrantyMonths(
          data.warrantyMonths ? String(data.warrantyMonths) : ""
        );
        setCategory(data.category || "");
        setReceipts(data.receipts || []);
        handleOpenSheet();
      } catch (error) {
        console.error("[handleStartAddFlow] An error occurred:", error);
        Alert.alert(
          "An Error Occurred",
          "Could not open the photo gallery. Please try again or check your device settings."
        );
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    Toast.show({
      type: "info",
      text1: "Please wait",
      text2: "Checking network connection...",
    });
  }, [clearForm, netInfo.isConnected]);

  // ... (The rest of your hook remains the same)
  const handleSaveProduct = useCallback(async () => {
    if (!productName || !warrantyMonths) {
      Toast.show({
        type: "error",
        text1: "Missing Info",
        text2: "Product name and warranty period are required.",
      });
      return;
    }
    setIsProcessing(true);
    try {
      let productImageUrl = null;
      if (netInfo.isConnected) {
        try {
          const imageRes = await apiClient.post("/find-product-image", {
            productName,
            category,
          });
          productImageUrl = imageRes.data.imageUrl;
        } catch (imageError) {
          console.log("Could not find product image, proceeding without it.");
        }
      }
      await database.write(async () => {
        await database.collections.get("warranties").create((warranty) => {
          warranty.productName = productName;
          warranty.purchaseDate = purchaseDate;
          warranty.warrantyLengthMonths = parseInt(warrantyMonths, 10);
          warranty.category = category;
          warranty.description = description;
          warranty.productImageUrl = productImageUrl;
          warranty.receiptsJson = JSON.stringify(receipts);
          warranty.syncStatus = "created";
        });
      });
      handleCloseSheet();
      if (netInfo.isConnected) {
        Toast.show({
          type: "info",
          text1: "Syncing...",
          text2: "Saving your new warranty to the cloud.",
        });
        await pushChangesToServer(database);
        await pullChangesFromServer(database);
      } else {
        Toast.show({
          type: "success",
          text1: "Saved Locally!",
          text2: "Will sync when you are next online.",
        });
      }
    } catch (error) {
      console.error("Save error:", error);
      Toast.show({
        type: "error",
        text1: "Save Failed",
        text2: "Could not save the warranty.",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [
    database,
    netInfo.isConnected,
    productName,
    purchaseDate,
    warrantyMonths,
    category,
    description,
    receipts,
  ]);

  const handleAddReceipt = useCallback(async () => {
    if (!netInfo.isConnected) {
      Toast.show({
        type: "info",
        text1: "Offline",
        text2: "File upload requires an internet connection.",
      });
      return;
    }
    if (receipts.length >= 3) {
      Toast.show({
        type: "info",
        text1: "Limit Reached",
        text2: "You can upload a maximum of 3 files.",
      });
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      if (result.canceled) return;
      const file = result.assets[0];
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType,
      });
      setIsUploading(true);
      const response = await apiClient.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setReceipts((prev) => [...prev, response.data]);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: "Could not upload the file.",
      });
    } finally {
      setIsUploading(false);
    }
  }, [receipts, netInfo.isConnected]);

  const handleRemoveReceipt = useCallback((indexToRemove) => {
    setReceipts((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const onDateChange = useCallback(
    (event, selectedDate) => {
      const currentDate = selectedDate || purchaseDate;
      setShowDatePicker(Platform.OS === "ios");
      setPurchaseDate(currentDate);
    },
    [purchaseDate]
  );

  const formProps = {
    productName,
    setProductName,
    purchaseDate,
    setPurchaseDate,
    warrantyMonths,
    setWarrantyMonths,
    description,
    setDescription,
    category,
    setCategory,
    receipts,
    showDatePicker,
    setShowDatePicker,
    isProcessing,
    isUploading,
    clearForm,
    onDateChange,
    handleAddReceipt,
    handleRemoveReceipt,
    handleSave: handleSaveProduct,
  };

  return {
    bottomSheetRef,
    isProcessing: isProcessing && !bottomSheetRef.current?.snapPoints,
    handleStartAddFlow,
    formProps,
  };
};
