import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router, useLocalSearchParams } from "expo-router";
import apiClient from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { getComponentStyles } from "../theme/componentStyles";

const ResetPasswordScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleReset = async () => {
    if (!code || !newPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/reset-password", { email, code, newPassword });
      Alert.alert("Success", "Your password has been reset. Please log in.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.msg || "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter the code sent to your email and a new password.
            </Text>
          </View>
          <TextInput
            style={componentStyles.input}
            placeholder="Reset Code"
            placeholderTextColor={colors.textSecondary}
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
          />
          <TextInput
            style={componentStyles.input}
            placeholder="New Password"
            placeholderTextColor={colors.textSecondary}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TouchableOpacity
            style={componentStyles.button}
            onPress={handleReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={componentStyles.buttonText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.card,
    },
    keyboardAvoidingView: {
      flex: 1,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    header: {
      alignItems: "center",
      marginBottom: 50,
    },
    title: {
      fontSize: 32,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    subtitle: {
      fontSize: 18,
      color: colors.textSecondary,
      marginTop: 10,
      textAlign: "center",
    },
  });

export default ResetPasswordScreen;
