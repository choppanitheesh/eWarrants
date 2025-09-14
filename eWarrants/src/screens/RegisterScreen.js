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

const RegisterScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/register", { fullName, email, password });
      router.push({ pathname: "/verify-email", params: { email } });
    } catch (error) {
      const errorMessage =
        error.response?.data?.msg || "An error occurred during registration.";
      Alert.alert("Registration Failed", errorMessage);
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
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>
              Create an account to get started!
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={componentStyles.input}
              placeholder="Full Name"
              placeholderTextColor={colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
            />
            <TextInput
              style={componentStyles.input}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={componentStyles.input}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity
              style={[componentStyles.button, { marginTop: 10 }]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={componentStyles.buttonText}>Sign up</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.replace("/")}
            disabled={isLoading}
          >
            <Text style={styles.signInLink}>
              Already have an account? Sign in
            </Text>
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
    form: {
      width: "100%",
    },
    signInLink: {
      fontSize: 14,
      color: colors.textPrimary,
      textAlign: "center",
      marginTop: 30,
    },
  });

export default RegisterScreen;
