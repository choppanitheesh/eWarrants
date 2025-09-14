import React from "react";
import {
  View,
  Text,
  SafeAreaView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Stack } from "expo-router";
import { useTheme } from "../../src/contexts/ThemeContext";

// A reusable component for the theme options
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

const AppearanceScreen = () => {
  const { theme, setTheme, colors } = useTheme();
  const styles = getStyles(colors);

  const themeOptions = [
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
    { label: "System", value: "system" },
  ];

  return (
    <SafeAreaView style={styles.wrapper}>
      <Stack.Screen options={{ title: "Appearance" }} />
      <View style={styles.container}>
        <Text style={styles.header}>Theme</Text>
        <Text style={styles.subtitle}>
          Choose how the app looks on your device. 'System' will match your
          phone's current setting.
        </Text>
        <SegmentedControl
          options={themeOptions}
          selectedValue={theme}
          onValueChange={setTheme}
          colors={colors}
        />
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
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: colors.inputBackground,
      borderRadius: 8,
      padding: 4,
    },
    segment: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 6,
    },
    segmentActive: {
      backgroundColor: colors.card,
    },
    segmentText: {
      textAlign: "center",
      fontWeight: "600",
      fontSize: 16,
      color: colors.textSecondary,
    },
    segmentTextActive: {
      color: colors.textPrimary,
    },
  });

export default AppearanceScreen;
