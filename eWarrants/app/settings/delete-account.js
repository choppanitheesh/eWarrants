import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { useTheme } from "../../src/contexts/ThemeContext";
import { getComponentStyles } from "../../src/theme/componentStyles";
import apiClient from "../../src/api"; 

const DeleteAccountScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteAccount = async () => {
    if (!password) {
      Alert.alert(
        "Password Required",
        "Please enter your password to confirm."
      );
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.delete("/account", { data: { password } });

      Toast.show({
        type: "success",
        text1: "Account Deleted",
        text2: "Your account and all data have been removed.",
      });

      await AsyncStorage.removeItem("userToken");
      router.replace("/"); 
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Deletion Failed",
        text2: error.response?.data?.msg || "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack.Screen options={{ title: "Delete Account" }} />
      <View style={styles.container}>
        <Text style={styles.header}>Are you sure?</Text>
        <Text style={styles.subtitle}>
          This action is permanent and cannot be undone. All of your saved
          warranties will be deleted forever.
        </Text>

        <Text style={styles.passwordLabel}>
          Please enter your password to confirm.
        </Text>
        <TextInput
          style={componentStyles.input}
          placeholder="Current Password"
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDeleteAccount}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={"#FFFFFF"} />
          ) : (
            <Text style={styles.deleteButtonText}>
              Permanently Delete Account
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    wrapper: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: 16,
    },
    header: {
      fontSize: 24,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 16,
      color: colors.textSecondary,
      marginBottom: 32,
    },
    passwordLabel: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 8,
      fontWeight: "500",
    },
    deleteButton: {
      backgroundColor: colors.destructive,
      borderRadius: 10,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 10,
    },
    deleteButtonText: {
      color: "#FFFFFF",
      fontSize: 18,
      fontWeight: "bold",
    },
  });

export default DeleteAccountScreen;
