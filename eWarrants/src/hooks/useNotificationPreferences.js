import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDatabase } from "../contexts/DatabaseContext";
import { syncNotifications } from "../services/NotificationService";
import apiClient from "../api";

const NOTIFICATION_PREFS_KEY = "eWarrants_notification_prefs_v1";

const defaultPrefs = {
  pushEnabled: true,
  reminderDays: 30,
  emailEnabled: false,
};

export const useNotificationPreferences = () => {
  const database = useDatabase();
  const [prefs, setPrefs] = useState(defaultPrefs);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATION_PREFS_KEY);
        if (stored) {
          setPrefs(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load notification preferences.", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadPrefs();
  }, []);

  const savePreferences = useCallback(
    async (newPrefs) => {
      try {
        setPrefs(newPrefs);
        await AsyncStorage.setItem(
          NOTIFICATION_PREFS_KEY,
          JSON.stringify(newPrefs)
        );

        if (database) {
          await syncNotifications(database, newPrefs);
        }

        await apiClient.post("/notification-prefs", {
          enabled: newPrefs.emailEnabled,
          reminderDays: newPrefs.reminderDays,
        });

        console.log("[Prefs] Settings saved locally and synced to server.");
      } catch (e) {
        console.error("Failed to save notification preferences.", e);
      }
    },
    [database]
  );

  return { prefs, savePreferences, isLoaded };
};
