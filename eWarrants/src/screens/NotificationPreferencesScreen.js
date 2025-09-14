import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "../contexts/ThemeContext";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";

const SettingsRow = ({ title, children, colors }) => (
  <View style={getStyles(colors).row}>
    <Text style={getStyles(colors).rowTitle}>{title}</Text>
    {children}
  </View>
);

const SegmentedControl = ({
  options,
  selectedValue,
  onValueChange,
  colors,
}) => (
  <View style={getStyles(colors).segmentedControl}>
    {options.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          getStyles(colors).segment,
          selectedValue === option.value && getStyles(colors).segmentActive,
        ]}
        onPress={() => onValueChange(option.value)}
      >
        <Text
          style={[
            getStyles(colors).segmentText,
            selectedValue === option.value &&
              getStyles(colors).segmentTextActive,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </View>
);

const NotificationPreferencesScreen = () => {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const { prefs, savePreferences, isLoaded } = useNotificationPreferences();

  if (!isLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const reminderOptions = [
    { label: "30 Days", value: 30 },
    { label: "14 Days", value: 14 },
    { label: "7 Days", value: 7 },
    { label: "1 Day", value: 1 },
  ];

  return (
    <SafeAreaView style={styles.wrapper}>
      <Stack.Screen options={{ title: "Notification Preferences" }} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Push Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingsRow title="Enable Reminders" colors={colors}>
              <Switch
                value={prefs.pushEnabled}
                onValueChange={(value) =>
                  savePreferences({ ...prefs, pushEnabled: value })
                }
                trackColor={{ false: colors.inputBackground, true: "#16a34a" }}
                thumbColor={colors.card}
              />
            </SettingsRow>
            {prefs.pushEnabled && (
              <>
                <View style={styles.divider} />
                <View style={styles.row}>
                  <Text style={styles.rowTitle}>Remind Me Before</Text>
                </View>
                <SegmentedControl
                  options={reminderOptions}
                  selectedValue={prefs.reminderDays}
                  onValueChange={(value) =>
                    savePreferences({ ...prefs, reminderDays: value })
                  }
                  colors={colors}
                />
              </>
            )}
          </View>
          <Text style={styles.sectionFooter}>
            Local notifications are scheduled on your device and work even when
            you're offline.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Email Notifications</Text>
          <View style={styles.sectionContent}>
            <SettingsRow title="Enable Email Reminders" colors={colors}>
              <Switch
                value={prefs.emailEnabled}
                onValueChange={(value) =>
                  savePreferences({ ...prefs, emailEnabled: value })
                }
                trackColor={{ false: colors.inputBackground, true: "#16a34a" }}
                thumbColor={colors.card}
              />
            </SettingsRow>
          </View>
          <Text style={styles.sectionFooter}>
            Email notifications are sent from our servers and require an
            internet connection to be updated.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.background },
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    container: { padding: 16 },
    section: { marginBottom: 24 },
    sectionHeader: {
      fontSize: 14,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 8,
      paddingHorizontal: 8,
    },
    sectionContent: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: "hidden",
    },
    sectionFooter: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 8,
      paddingHorizontal: 12,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
    },
    rowTitle: { fontSize: 16, color: colors.textPrimary },
    divider: {
      height: 1,
      backgroundColor: colors.background,
      marginHorizontal: 16,
    },
    segmentedControl: {
      flexDirection: "row",
      padding: 16,
      justifyContent: "space-around",
    },
    segment: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
    },
    segmentActive: { backgroundColor: colors.primary },
    segmentText: { color: colors.textPrimary, fontWeight: "600" },
    segmentTextActive: { color: colors.primaryText },
  });

export default NotificationPreferencesScreen;
