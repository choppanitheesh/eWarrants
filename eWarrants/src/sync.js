import { Q } from "@nozbe/watermelondb";
import AsyncStorage from "@react-native-async-storage/async-storage";
import apiClient from "./api";

export const LAST_PULLED_AT_KEY = "eWarrants_last_pulled_at";

const createWarrantyPayload = (localWarranty) => {
  return {
    productName: localWarranty.productName,
    purchaseDate: localWarranty.purchaseDate,
    warrantyLengthMonths: localWarranty.warrantyLengthMonths,
    category: localWarranty.category,
    description: localWarranty.description,
    productImageUrl: localWarranty.productImageUrl,
    receipts: JSON.parse(localWarranty.receiptsJson || "[]"),
  };
};

export const pushChangesToServer = async (database) => {
  try {
    const warrantiesCollection = database.collections.get("warranties");

    const createdToSync = await warrantiesCollection
      .query(Q.where("sync_status", "created"))
      .fetch();
    const updatedToSync = await warrantiesCollection
      .query(Q.where("sync_status", "updated"))
      .fetch();
    const deletedToSync = await warrantiesCollection
      .query(Q.where("sync_status", "deleted"))
      .fetch();

    for (const local of createdToSync) {
      try {
        const payload = createWarrantyPayload(local);
        const response = await apiClient.post("/warranties", payload);
        await database.write(async () => {
          await local.update((rec) => {
            rec.serverId = response.data._id;
            rec.syncStatus = "synced";
          });
        });
      } catch (e) {
        console.error(
          `[Sync] Failed to push created record ${local.id}:`,
          e.response?.data || e.message
        );
      }
    }

    for (const local of updatedToSync) {
      try {
        const payload = createWarrantyPayload(local);
        await apiClient.put(`/warranties/${local.serverId}`, payload);
        await database.write(async () => {
          await local.update((rec) => {
            rec.syncStatus = "synced";
          });
        });
      } catch (e) {
        console.error(
          `[Sync] Failed to push updated record ${local.id}:`,
          e.response?.data || e.message
        );
      }
    }

    for (const local of deletedToSync) {
      try {
        if (local.serverId) {
          await apiClient.delete(`/warranties/${local.serverId}`);
        }
        await database.write(async () => {
          await local.destroyPermanently();
        });
      } catch (e) {
        console.error(
          `[Sync] Failed to push deleted record ${local.id}:`,
          e.response?.data || e.message
        );
      }
    }
  } catch (error) {
    console.error("[Sync] Error during push process:", error);
  }
};

export const pullChangesFromServer = async (database) => {
  try {
    const lastPulledAt = await AsyncStorage.getItem(LAST_PULLED_AT_KEY);
    if (!lastPulledAt) {
      console.log(
        "[Sync] First sync detected. Wiping local database before pulling."
      );
      await database.write(async () => {
        await database.unsafeResetDatabase();
      });
    }

    const url = `/warranties${
      lastPulledAt ? `?lastPulledAt=${lastPulledAt}` : ""
    }`;

    console.log(
      `[Sync] Pulling changes since ${
        lastPulledAt
          ? new Date(parseInt(lastPulledAt, 10)).toISOString()
          : "the beginning of time"
      }...`
    );

    const response = await apiClient.get(url);
    const serverChanges = response.data;
    const newPulledAt = Date.now();

    if (serverChanges.length === 0) {
      console.log("[Sync] No new changes from server.");
      await AsyncStorage.setItem(LAST_PULLED_AT_KEY, newPulledAt.toString());
      return;
    }

    console.log(`[Sync] Received ${serverChanges.length} changes from server.`);
    const warrantiesCollection = database.collections.get("warranties");

    await database.write(async () => {
      for (const serverWarranty of serverChanges) {
        const existingLocalResult = await warrantiesCollection
          .query(Q.where("server_id", serverWarranty._id))
          .fetch();
        const existingLocal = existingLocalResult[0];

        if (existingLocal) {
          await existingLocal.update((record) => {
            record.productName = serverWarranty.productName;
            record.purchaseDate = new Date(serverWarranty.purchaseDate);
            record.warrantyLengthMonths = serverWarranty.warrantyLengthMonths;
            record.category = serverWarranty.category;
            record.description = serverWarranty.description;
            record.productImageUrl = serverWarranty.productImageUrl;
            record.receiptsJson = JSON.stringify(serverWarranty.receipts);
            record.syncStatus = "synced";
          });
        } else {
          await warrantiesCollection.create((warranty) => {
            warranty.serverId = serverWarranty._id;
            warranty.productName = serverWarranty.productName;
            warranty.purchaseDate = new Date(serverWarranty.purchaseDate);
            warranty.warrantyLengthMonths = serverWarranty.warrantyLengthMonths;
            warranty.category = serverWarranty.category;
            warranty.description = serverWarranty.description;
            warranty.productImageUrl = serverWarranty.productImageUrl;
            warranty.receiptsJson = JSON.stringify(serverWarranty.receipts);
            warranty.syncStatus = "synced";
          });
        }
      }
    });

    await AsyncStorage.setItem(LAST_PULLED_AT_KEY, newPulledAt.toString());
    console.log("[Sync] Pull complete. New lastPulledAt time saved.");
  } catch (error) {
    console.error("[Sync] Error during pull process:", error);
  }
};
