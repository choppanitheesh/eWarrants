import { Stack, router } from "expo-router";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { AppState } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Toast from "react-native-toast-message";
import { MenuProvider } from "react-native-popup-menu";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DatabaseProvider, useDatabase } from "../src/contexts/DatabaseContext";
import { ThemeProvider } from "../src/contexts/ThemeProvider";
import { useTheme } from "../src/contexts/ThemeContext";
import apiClient from "../src/api";
import { pushChangesToServer, pullChangesFromServer } from "../src/sync";
import { syncNotifications } from "../src/services/NotificationService";
import { useNotificationPreferences } from "../src/hooks/useNotificationPreferences";

SplashScreen.preventAutoHideAsync();

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
    runSync();
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        runSync();
      }
      appState.current = nextAppState;
    });
    return () => subscription.remove();
  }, [runSync]);

  return null;
};

function RootLayoutNav() {
  const { colors } = useTheme();

  useEffect(() => {
    async function setupApp() {
      try {
        const token = await AsyncStorage.getItem("userToken");
        if (token) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/");
        }
      } catch (e) {
        console.error("Setup error", e);
        router.replace("/");
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    setupApp();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.textPrimary,
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ title: "Register" }} />
        <Stack.Screen
          name="verify-email"
          options={{ title: "Verify Account" }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{ title: "Forgot Password" }}
        />
        <Stack.Screen
          name="reset-password"
          options={{ title: "Reset Password" }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="warranty/[id]"
          options={{
            presentation: "modal",
            title: "Warranty Details",
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="warranty/edit/[id]"
          options={{ presentation: "modal", title: "Edit Warranty" }}
        />
        <Stack.Screen
          name="settings/notifications"
          options={{
            presentation: "modal",
            title: "Notification Preferences",
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="settings/appearance"
          options={{
            presentation: "modal",
            title: "Appearance",
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="settings/change-password"
          options={{
            presentation: "modal",
            title: "Change Password",
            headerStyle: { backgroundColor: colors.background },
          }}
        />
        <Stack.Screen
          name="settings/delete-account"
          options={{
            presentation: "modal",
            title: "Delete Account",
            headerStyle: { backgroundColor: colors.background },
          }}
        />
      </Stack>
      <Toast topOffset={60} />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <MenuProvider>
        <DatabaseProvider>
          <ThemeProvider>
            <RootLayoutNav />
          </ThemeProvider>
        </DatabaseProvider>
      </MenuProvider>
    </SafeAreaProvider>
  );
}
