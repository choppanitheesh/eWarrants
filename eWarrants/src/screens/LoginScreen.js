import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Toast from "react-native-toast-message";

import apiClient from "../api";
import { useDatabase } from "../contexts/DatabaseContext";
import { pullChangesFromServer } from "../sync";
import { useTheme } from "../contexts/ThemeContext";
import { getComponentStyles } from "../theme/componentStyles";

const LoginScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const database = useDatabase();

  const handleLogin = async () => {
    if (!email || !password) {
      Toast.show({
        type: "error",
        text1: "Missing Fields",
        text2: "Please fill in both email and password.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.post("/login", { email, password });
      const token = response.data.token;

      await AsyncStorage.setItem("userToken", token);

      Toast.show({
        type: "info",
        text1: "Syncing Data",
        text2: "Getting your warranties...",
      });
      await pullChangesFromServer(database);

      router.replace("/(tabs)/home");
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Login Failed",
        text2:
          error.response?.data?.msg ||
          "Please check your credentials and try again.",
      });
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
            <Text style={styles.title}>Login here</Text>
            <Text style={styles.subtitle}>
              Welcome back you've been missed!
            </Text>
          </View>

          <View style={styles.form}>
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
            <TouchableOpacity onPress={() => router.push("/forgot-password")}>
              <Text style={styles.forgotPassword}>Forgot your password?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={componentStyles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={componentStyles.buttonText}>Sign in</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => router.push("/register")}
            disabled={isLoading}
          >
            <Text style={styles.createAccount}>Create new account</Text>
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
    forgotPassword: {
      fontSize: 14,
      color: colors.textPrimary,
      textAlign: "right",
      marginBottom: 20,
    },
    createAccount: {
      fontSize: 14,
      color: colors.textPrimary,
      textAlign: "center",
      marginTop: 30,
    },
  });

export default LoginScreen;
