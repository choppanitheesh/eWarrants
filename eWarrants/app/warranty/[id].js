import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Linking,
  Alert,
} from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useDatabase } from "../../src/contexts/DatabaseContext";
import Toast from "react-native-toast-message";
import { getExpiryDate } from "../../src/utils/dateUtils";
import { useNetInfo } from "@react-native-community/netinfo";
import { pushChangesToServer } from "../../src/sync";
import { useTheme } from "../../src/contexts/ThemeContext";
import { getDefaultImageForCategory } from "../../src/utils/imageUtils";

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const WarrantyDetailScreen = () => {
  const { theme, colors } = useTheme();
  const styles = getStyles(colors, theme);

  const { id } = useLocalSearchParams();
  const database = useDatabase();
  const netInfo = useNetInfo();
  const [warranty, setWarranty] = useState(null);

  useEffect(() => {
    if (!id) return;
    const warrantyCollection = database.collections.get("warranties");
    const observable = warrantyCollection.findAndObserve(id);
    const subscription = observable.subscribe(
      (localWarranty) => {
        setWarranty(localWarranty);
      },
      (error) => {
        router.back();
      }
    );
    return () => subscription.unsubscribe();
  }, [id, database]);

  const handleDelete = () => {
    Alert.alert(
      "Delete Warranty",
      "Are you sure you want to permanently delete this warranty?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await database.write(async () => {
                await warranty.update((record) => {
                  record.syncStatus = "deleted";
                });
              });
              router.back();
              if (netInfo.isConnected) {
                await pushChangesToServer(database);
              }
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Error",
                text2: "Could not delete warranty.",
              });
            }
          },
        },
      ]
    );
  };

  if (!warranty) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <Stack.Screen
          options={{
            title: "Loading...",
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const expiryDate = getExpiryDate(
    warranty.purchaseDate,
    warranty.warrantyLengthMonths
  );
  const receipts = JSON.parse(warranty.receiptsJson || "[]");
  const imageSource = warranty.productImageUrl
    ? { uri: warranty.productImageUrl }
    : getDefaultImageForCategory(warranty.category);

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack.Screen
        options={{
          title: "Warranty Details",
          headerBackTitle: "Back",
          headerStyle: { backgroundColor: colors.background },
          headerTitleStyle: { color: colors.textPrimary, fontWeight: "bold" },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      />
      <ScrollView contentContainerStyle={styles.container}>
        <Image source={imageSource} style={styles.productImage} />

        <View style={styles.detailsSection}>
          <Text style={styles.productName}>{warranty.productName}</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Category</Text>
              <Text style={styles.infoValue}>{warranty.category || "N/A"}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Date</Text>
              <Text style={styles.infoValue}>
                {formatDate(warranty.purchaseDate)}
              </Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Warranty Expires</Text>
              <Text style={styles.infoValue}>{formatDate(expiryDate)}</Text>
            </View>
          </View>

          {warranty.description && (
            <View style={styles.descriptionBox}>
              <Text style={styles.infoLabel}>Notes</Text>
              <Text style={styles.descriptionText}>{warranty.description}</Text>
            </View>
          )}
        </View>

        <View style={styles.footerButtons}>
          {receipts && receipts.length > 0 && (
            <View style={styles.infoCard}>
              <Text style={styles.receiptsTitle}>Attached Files</Text>
              {receipts.map((receipt, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.receiptLink}
                  onPress={() => Linking.openURL(receipt.url)}
                >
                  <Text style={styles.receiptLinkText} numberOfLines={1}>
                    {receipt.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.button, styles.editButton]}
              onPress={() => router.push(`/warranty/edit/${id}`)}
            >
              <Text style={styles.buttonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors, theme) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    container: { paddingBottom: 40 },
    productImage: {
      width: "90%",
      height: 250,
      borderRadius: 20,
      alignSelf: "center",
      marginTop: 20,
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
    },
    detailsSection: {
      padding: 20,
    },
    productName: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 20,
      textAlign: "center",
    },
    infoCard: {
      backgroundColor: colors.card,
      borderRadius: 16,
      elevation: 5,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: 20,
    },
    infoLabel: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    infoValue: {
      fontSize: 16,
      color: colors.textPrimary,
      fontWeight: "600",
    },
    descriptionBox: {
      marginTop: 20,
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 20,
    },
    descriptionText: {
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 8,
      lineHeight: 24,
    },
    footerButtons: {
      paddingHorizontal: 20,
      marginTop: 10,
    },
    actionButtons: {
      flexDirection: "row",
      marginTop: 20,
    },
    button: {
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      flex: 1,
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "bold",
    },
    editButton: {
      marginRight: 10,
      backgroundColor: colors.primary,
    },
    deleteButton: {
      marginLeft: 10,
      backgroundColor: theme === "dark" ? "rgba(239, 68, 68, 0.2)" : "#fee2e2",
    },
    deleteButtonText: {
      color: colors.destructive,
      fontSize: 16,
      fontWeight: "bold",
    },
    receiptsTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      padding: 20,
      paddingBottom: 10,
    },
    receiptLink: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    receiptLinkText: {
      color: "#0ea5e9",
      fontSize: 16,
    },
  });

export default WarrantyDetailScreen;
