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

const VerificationScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const { email } = useLocalSearchParams();
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (!code || code.length < 6) {
      Alert.alert("Error", "Please enter the 6-digit verification code.");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/verify-email", { email, code });
      Alert.alert("Success", "Your account is now verified. Please log in.", [
        { text: "OK", onPress: () => router.replace("/") },
      ]);
    } catch (error) {
      Alert.alert(
        "Verification Failed",
        error.response?.data?.msg || "An error occurred."
      );
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
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              Enter the 6-digit code sent to {email}
            </Text>
          </View>
          <TextInput
            style={[componentStyles.input, styles.codeInput]}
            placeholder="------"
            placeholderTextColor={colors.textSecondary}
            value={code}
            onChangeText={setCode}
            keyboardType="numeric"
            maxLength={6}
          />
          <TouchableOpacity
            style={componentStyles.button}
            onPress={handleVerify}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={componentStyles.buttonText}>Verify Account</Text>
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
      fontSize: 16,
      color: colors.textSecondary,
      marginTop: 10,
      textAlign: "center",
    },
    codeInput: {
      textAlign: "center",
      fontSize: 20,
      letterSpacing: 8,
    },
  });

export default VerificationScreen;
