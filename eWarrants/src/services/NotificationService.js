import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { Q } from "@nozbe/watermelondb";
import { getExpiryDate } from "../utils/dateUtils";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const syncNotifications = async (database, prefs) => {
  if (!prefs || !prefs.pushEnabled) {
    console.log(
      "[Notifications] Push notifications are disabled by the user. Clearing any existing notifications."
    );
    await Notifications.cancelAllScheduledNotificationsAsync();
    return;
  }

  if (!Device.isDevice) {
    console.log(
      "[Notifications] Not on a physical device, skipping scheduling."
    );
    return;
  }

  // --- Ask for OS-level Permission ---
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") {
    console.log("[Notifications] OS-level permission not granted!");
    return;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    const warrantiesCollection = database.collections.get("warranties");
    const allWarranties = await warrantiesCollection
      .query(Q.where("sync_status", Q.notEq("deleted")))
      .fetch();

    let scheduledCount = 0;
    for (const warranty of allWarranties) {
      const expiryDate = getExpiryDate(
        warranty.purchaseDate,
        warranty.warrantyLengthMonths
      );
      const notificationDate = new Date(expiryDate);
      notificationDate.setDate(notificationDate.getDate() - prefs.reminderDays);

      if (notificationDate > new Date()) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "eWarrants: Warranty Expiring Soon!",
            body: `Your warranty for "${warranty.productName}" expires in ${prefs.reminderDays} days.`,
            data: { warrantyId: warranty.id },
          },
          trigger: notificationDate,
        });
        scheduledCount++;
      }
    }
    console.log(
      `[Notifications] Successfully scheduled ${scheduledCount} new notifications based on user preferences.`
    );
  } catch (error) {
    console.error("[Notifications] Error during sync:", error);
  }

  if (prefs.emailEnabled) {
    console.log(
      "[Notifications] Email notifications are enabled, but backend logic is not yet implemented."
    );
  }
};
