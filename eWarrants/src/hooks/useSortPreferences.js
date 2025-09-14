import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFERENCES_KEY = "eWarrants_sort_preferences_v1";

const defaultPreferences = {
  sortKey: "expiryDate",
  sortOrder: "asc",
  grouping: "none",
};

export const useSortPreferences = () => {
  const [preferences, setPreferences] = useState(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedPrefs = await AsyncStorage.getItem(PREFERENCES_KEY);
        if (storedPrefs) {
          setPreferences(JSON.parse(storedPrefs));
        }
      } catch (e) {
        console.error("Failed to load sort preferences.", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPreferences();
  }, []);

  const savePreferences = useCallback(async (newPrefs) => {
    try {
      setPreferences(newPrefs);
      const jsonValue = JSON.stringify(newPrefs);
      await AsyncStorage.setItem(PREFERENCES_KEY, jsonValue);
    } catch (e) {
      console.error("Failed to save sort preferences.", e);
    }
  }, []);

  return { preferences, savePreferences, isLoaded };
};
