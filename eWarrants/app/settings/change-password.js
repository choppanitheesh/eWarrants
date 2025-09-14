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
import { useTheme } from "../../src/contexts/ThemeContext";
import { getComponentStyles } from "../../src/theme/componentStyles";
import apiClient from "../../src/api";

const ChangePasswordScreen = () => {
  const { theme, colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getStyles(colors);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Missing Fields", "Please fill in both password fields.");
      return;
    }
    setIsLoading(true);
    try {
      await apiClient.post("/change-password", {
        currentPassword,
        newPassword,
      });
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Your password has been updated.",
      });
      router.back();
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: error.response?.data?.msg || "An error occurred.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <Stack.Screen options={{ title: "Change Password" }} />
      <View style={styles.container}>
        <Text style={styles.header}>Update Your Password</Text>
        <Text style={styles.subtitle}>
          Your new password must be at least 6 characters long.
        </Text>

        <TextInput
          style={componentStyles.input}
          placeholder="Current Password"
          placeholderTextColor={colors.textSecondary}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
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
          style={[componentStyles.button, { marginTop: 10 }]}
          onPress={handleUpdatePassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={componentStyles.buttonText}>Save Changes</Text>
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
      marginBottom: 24,
    },
  });

export default ChangePasswordScreen;
