
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useNetInfo } from "@react-native-community/netinfo";

import HomeIcon from "../../src/components/HomeIcon";
import ChatIcon from "../../src/components/ChatIcon";
import SettingsIcon from "../../src/components/SettingsIcon";
import { useTheme } from "../../src/contexts/ThemeContext";
import { useDatabase } from "../../src/contexts/DatabaseContext";
import { useNotificationPreferences } from "../../src/hooks/useNotificationPreferences";
import { pushChangesToServer, pullChangesFromServer } from "../../src/sync";
import { syncNotifications } from "../../src/services/NotificationService";

const SyncManager = () => {
  const database = useDatabase();
  const netInfo = useNetInfo();
  const { prefs: notificationPrefs, isLoaded: prefsLoaded } =
    useNotificationPreferences();
  const appState = useRef(AppState.currentState);

  const runSync = useCallback(async () => {
    if (!prefsLoaded) return;
    if (netInfo.isConnected) {
      await pushChangesToServer(database);
      await pullChangesFromServer(database);
      await syncNotifications(database, notificationPrefs);
    }
  }, [database, netInfo.isConnected, notificationPrefs, prefsLoaded]);

  useEffect(() => {
    runSync(); // Run sync when the component mounts

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        runSync(); // Run sync when app comes to foreground
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [runSync]);

  return null;
};

export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <>
      <SyncManager />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: false,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
          },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <HomeIcon focused={focused} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="ai-chat"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <ChatIcon focused={focused} color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            tabBarIcon: ({ focused, color, size }) => (
              <SettingsIcon focused={focused} color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}
