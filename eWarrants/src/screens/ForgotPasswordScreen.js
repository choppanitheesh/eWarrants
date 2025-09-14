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
import { router } from "expo-router";
import apiClient from "../api";
import { useTheme } from "../contexts/ThemeContext";
import { getComponentStyles } from "../theme/componentStyles";

const ForgotPasswordScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestReset = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter your email address.");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/forgot-password", { email });
      Alert.alert(
        "Check Your Email",
        "If an account exists, a password reset code has been sent.",
        [
          {
            text: "OK",
            onPress: () =>
              router.push({ pathname: "/reset-password", params: { email } }),
          },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "An unexpected error occurred.");
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
            <Text style={styles.title}>Forgot Password</Text>
            <Text style={styles.subtitle}>
              Enter your email to receive a reset code.
            </Text>
          </View>
          <TextInput
            style={componentStyles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity
            style={componentStyles.button}
            onPress={handleRequestReset}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryText} />
            ) : (
              <Text style={componentStyles.buttonText}>Send Reset Code</Text>
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

export default ForgotPasswordScreen;
