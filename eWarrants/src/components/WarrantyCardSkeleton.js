import React from "react";
import { View, StyleSheet } from "react-native";
import { Skeleton } from "moti/skeleton";

const WarrantyCardSkeleton = () => {
  return (
    <View style={styles.cardContainer}>
      <Skeleton colorMode="light" width={90} height={90} radius={12} />
      <View style={styles.cardDetails}>
        <View>
          <Skeleton colorMode="light" width={"80%"} height={20} />
          <View style={{ height: 4 }} />
          <Skeleton colorMode="light" width={"50%"} height={15} />
        </View>
        <View style={styles.bottomRow}>
          <Skeleton colorMode="light" width={"40%"} height={15} />
          <Skeleton colorMode="light" width={80} height={26} radius={13} />
        </View>
      </View>
    </View>
  );
};

// Use similar styling to your real card for consistent layout
const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    flexDirection: "row",
    marginBottom: 15,
    padding: 12,
  },
  cardDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

export default WarrantyCardSkeleton;
