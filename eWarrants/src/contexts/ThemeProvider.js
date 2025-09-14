import React, { useState, useEffect, useCallback } from "react";
import { Appearance, useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ThemeContext from "./ThemeContext";
import { lightColors, darkColors } from "../theme/colors";

const THEME_STORAGE_KEY = "eWarrants_user_theme_v1";

export const ThemeProvider = ({ children }) => {
  const systemTheme = useColorScheme();
  const [theme, setThemeState] = useState("system");
  useEffect(() => {
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) {
        setThemeState(savedTheme);
      }
    };
    loadTheme();
  }, []);

  const setTheme = useCallback(async (newTheme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
  }, []);

  const activeTheme = theme === "system" ? systemTheme : theme;
  const colors = activeTheme === "dark" ? darkColors : lightColors;

  const contextValue = {
    theme, // The user's preference ('light', 'dark', 'system')
    colors, // The actual colors object to be used
    setTheme, // The function to change the preference
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
