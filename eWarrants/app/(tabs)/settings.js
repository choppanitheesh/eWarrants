import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useDatabase } from "../../src/contexts/DatabaseContext";
import apiClient from "../../src/api";
import { LAST_PULLED_AT_KEY } from "../../src/sync";

const SettingsRow = ({
  title,
  subtitle,
  onPress,
  children,
  isDestructive = false,
  colors,
  isLoading = false,
}) => (
  <TouchableOpacity
    style={styles.row(colors)}
    onPress={onPress}
    disabled={isLoading}
  >
    <View>
      <Text
        style={[
          styles.rowTitle(colors),
          isDestructive && styles.destructiveText(colors),
        ]}
      >
        {title}
      </Text>
      {subtitle && <Text style={styles.rowSubtitle(colors)}>{subtitle}</Text>}
    </View>
    {isLoading ? (
      <ActivityIndicator color={colors.textSecondary} />
    ) : children ? (
      children
    ) : (
      !isDestructive && <Text style={styles.chevron(colors)}>›</Text>
    )}
  </TouchableOpacity>
);

const SettingsScreen = () => {
  const { theme, colors } = useTheme();
  const database = useDatabase();
  const [isExporting, setIsExporting] = useState(false);

  // --- HANDLER FUNCTIONS ---

  const handleLogout = async () => {
    try {
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
      await AsyncStorage.removeItem("userToken");
      await AsyncStorage.removeItem(LAST_PULLED_AT_KEY);

      router.replace("/");
    } catch (error) {
      console.error("Failed to logout and reset database:", error);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await apiClient.get("/account/export");
      const csvData = response.data;
      const filePath = FileSystem.documentDirectory + "eWarrants_Export.csv";
      await FileSystem.writeAsStringAsync(filePath, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(filePath, {
          mimeType: "text/csv",
          dialogTitle: "Export your warranties",
        });
      } else {
        Toast.show({
          type: "info",
          text1: "Sharing not available on this device.",
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Export Failed",
        text2: "No warranties found to export.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleSendFeedback = async () => {
    await Linking.openURL(
      "mailto:cnitheesh7@gmail.com?subject=eWarrants App Feedback"
    );
  };

  const handleOpenURL = async (url) => {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Toast.show({ type: "error", text1: `Could not open the link.` });
    }
  };

  const appVersion = Constants.expoConfig.version;

  return (
    <SafeAreaView style={styles.wrapper(colors)}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header(colors)}>Settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader(colors)}>Preferences</Text>
          <View style={styles.sectionContent(colors)}>
            <SettingsRow
              title="Appearance"
              subtitle={theme.charAt(0).toUpperCase() + theme.slice(1)}
              onPress={() => router.push("/settings/appearance")}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader(colors)}>Notifications</Text>
          <View style={styles.sectionContent(colors)}>
            <SettingsRow
              title="Notification Preferences"
              subtitle="Choose when to be reminded"
              onPress={() => router.push("/settings/notifications")}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader(colors)}>Data Management</Text>
          <View style={styles.sectionContent(colors)}>
            <SettingsRow
              title="Export Data"
              subtitle="Save all warranties as a CSV file"
              onPress={handleExport}
              colors={colors}
              isLoading={isExporting}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader(colors)}>Account</Text>
          <View style={styles.sectionContent(colors)}>
            <SettingsRow
              title="Change Password"
              onPress={() => router.push("/settings/change-password")}
              colors={colors}
            />
            <SettingsRow
              title="Delete Account"
              isDestructive={true}
              onPress={() => router.push("/settings/delete-account")}
              colors={colors}
            />
            <SettingsRow
              title="Logout"
              isDestructive={true}
              onPress={handleLogout}
              colors={colors}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader(colors)}>App</Text>
          <View style={styles.sectionContent(colors)}>
            <View style={styles.row(colors)}>
              <Text style={styles.rowTitle(colors)}>Version</Text>
              <Text style={styles.rowSubtitle(colors)}>{appVersion}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader(colors)}>About & Support</Text>
          <View style={styles.sectionContent(colors)}>
            <SettingsRow
              title="Send Feedback"
              onPress={handleSendFeedback}
              colors={colors}
            />
            <SettingsRow
              title="Privacy Policy"
              onPress={() =>
                handleOpenURL("https://ewarrants.netlify.app/privacy-policy")
              }
              colors={colors}
            />
            <SettingsRow
              title="Terms of Service"
              onPress={() =>
                handleOpenURL("https://ewarrants.netlify.app/terms-conditions")
              }
              colors={colors}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  wrapper: (colors) => ({
    flex: 1,
    backgroundColor: colors.background,
  }),
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: (colors) => ({
    fontSize: 32,
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 20,
  }),
  section: {
    marginBottom: 24,
  },
  sectionHeader: (colors) => ({
    fontSize: 14,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    marginBottom: 8,
    paddingHorizontal: 8,
  }),
  sectionContent: (colors) => ({
    backgroundColor: colors.card,
    borderRadius: 12,
    overflow: "hidden",
  }),
  row: (colors) => ({
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.background,
  }),
  rowTitle: (colors) => ({
    fontSize: 16,
    color: colors.textPrimary,
  }),
  rowSubtitle: (colors) => ({
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  }),
  chevron: (colors) => ({
    fontSize: 24,
    color: colors.textSecondary,
  }),
  destructiveText: (colors) => ({
    color: colors.destructive,
  }),
};

export default SettingsScreen;
