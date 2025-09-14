import React from "react";
import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { useDatabase } from "../contexts/DatabaseContext";
import { Q } from "@nozbe/watermelondb";
import { getExpiryDate } from "../utils/dateUtils";
import Toast from "react-native-toast-message";
import { useTheme } from "../contexts/ThemeContext";

const WarrantyCardInChat = ({ warranty }) => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const database = useDatabase();
  const expiryDate = getExpiryDate(
    warranty.purchaseDate,
    warranty.warrantyLengthMonths
  );

  const handlePress = async () => {
    try {
      const warrantiesCollection = database.collections.get("warranties");
      const results = await warrantiesCollection
        .query(Q.where("server_id", warranty._id))
        .fetch();

      const localRecord = results[0];

      if (localRecord && localRecord.id) {
        router.push(`/warranty/${localRecord.id}`);
      } else {
        Toast.show({
          type: "error",
          text1: "Not Found",
          text2: "This warranty is not yet synced to your device.",
        });
      }
    } catch (error) {
      console.error("Chat card navigation error:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not open warranty details.",
      });
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <Image
        source={{
          uri: warranty.productImageUrl || "https://placehold.co/400x400",
        }}
        style={styles.image}
      />
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={1}>
          {warranty.productName}
        </Text>
        <Text style={styles.subtitle}>
          Expires: {expiryDate.toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      padding: 10,
      marginTop: 8,
      backgroundColor: colors.inputBackground,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    image: {
      width: 40,
      height: 40,
      borderRadius: 8,
      marginRight: 12,
    },
    details: {
      flex: 1,
    },
    title: {
      fontWeight: "600",
      fontSize: 15,
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 13,
      color: colors.textSecondary,
    },
  });

export default WarrantyCardInChat;
