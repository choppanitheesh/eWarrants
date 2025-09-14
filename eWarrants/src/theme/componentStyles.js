import { StyleSheet } from "react-native";

export const getComponentStyles = (colors) =>
  StyleSheet.create({
    input: {
      backgroundColor: colors.inputBackground,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
      marginBottom: 18,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: 10,
      paddingVertical: 18,
      alignItems: "center",
    },
    buttonText: {
      color: colors.primaryText,
      fontSize: 18,
      fontWeight: "bold",
    },
    destructiveButtonText: {
      color: colors.destructive,
      fontWeight: "600",
    },
    label: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: "500",
    },
  });
