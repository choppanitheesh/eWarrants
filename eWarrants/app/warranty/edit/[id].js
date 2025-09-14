import React, { useState, useEffect } from "react";
import {
  View,
  SafeAreaView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import { useNetInfo } from "@react-native-community/netinfo";

import apiClient from "../../../src/api";
import { useDatabase } from "../../../src/contexts/DatabaseContext";
import { pushChangesToServer, pullChangesFromServer } from "../../../src/sync";
import WarrantyForm from "../../../src/components/WarrantyForm";
import { useTheme } from "../../../src/contexts/ThemeContext"; 


const EditWarrantyScreen = () => {
  const { colors } = useTheme(); 
  const styles = getStyles(colors);

  const { id } = useLocalSearchParams();
  const database = useDatabase();
  const netInfo = useNetInfo();

  const [localWarranty, setLocalWarranty] = useState(null);
  const [productName, setProductName] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date());
  const [warrantyMonths, setWarrantyMonths] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [receipts, setReceipts] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchWarranty = async () => {
      try {
        const warranty = await database.collections.get("warranties").find(id);
        setLocalWarranty(warranty);
        setProductName(warranty.productName);
        setPurchaseDate(new Date(warranty.purchaseDate));
        setWarrantyMonths(String(warranty.warrantyLengthMonths));
        setDescription(warranty.description || "");
        setCategory(warranty.category || "");
        setReceipts(JSON.parse(warranty.receiptsJson || "[]"));
      } catch (error) {
        Toast.show({ type: "error", text1: "Load Failed" });
        router.back();
      } finally {
        setIsLoading(false);
      }
    };
    fetchWarranty();
  }, [id, database]);
  const handleUpdate = async () => {
    if (!productName || !warrantyMonths) {
      Toast.show({ type: "error", text1: "Missing Info" });
      return;
    }
    setIsSaving(true);
    try {
      await database.write(async () => {
        await localWarranty.update((warranty) => {
          warranty.productName = productName;
          warranty.purchaseDate = purchaseDate;
          warranty.warrantyLengthMonths = parseInt(warrantyMonths, 10);
          warranty.category = category;
          warranty.description = description;
          warranty.receiptsJson = JSON.stringify(receipts);
          if (warranty.syncStatus !== "created") {
            warranty.syncStatus = "updated";
          }
        });
      });
      router.back();
      if (netInfo.isConnected) {
        await pushChangesToServer(database);
        await pullChangesFromServer(database);
      }
    } catch (error) {
      Toast.show({ type: "error", text1: "Update Failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddReceipt = async () => {
    if (!netInfo.isConnected) {
      Toast.show({
        type: "info",
        text1: "Offline",
        text2: "File uploads require an internet connection.",
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
      setReceipts([...receipts, response.data]);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: "Could not upload the file. Please try again.",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveReceipt = (indexToRemove) => {
    setReceipts(receipts.filter((_, index) => index !== indexToRemove));
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || purchaseDate;
    setShowDatePicker(Platform.OS === "ios");
    setPurchaseDate(currentDate);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper}>
      <Stack.Screen options={{ title: "Edit Warranty" }} />
      <WarrantyForm
        productName={productName}
        setProductName={setProductName}
        category={category}
        setCategory={setCategory}
        purchaseDate={purchaseDate}
        setPurchaseDate={setPurchaseDate}
        warrantyMonths={warrantyMonths}
        setWarrantyMonths={setWarrantyMonths}
        description={description}
        setDescription={setDescription}
        receipts={receipts}
        showDatePicker={showDatePicker}
        setShowDatePicker={setShowDatePicker}
        onDateChange={onDateChange}
        handleAddReceipt={handleAddReceipt}
        handleRemoveReceipt={handleRemoveReceipt}
        handleSave={handleUpdate}
        isSaving={isSaving}
        isUploading={isUploading}
      />
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.card,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.card,
    },
  });

export default EditWarrantyScreen;
