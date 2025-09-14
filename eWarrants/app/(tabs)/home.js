// app/(tabs)/home.js
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Platform,
  SectionList,
} from "react-native";
import { router } from "expo-router";
import { BottomSheetBackdrop } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Menu,
  MenuOptions,
  MenuOption,
  MenuTrigger,
} from "react-native-popup-menu";

import { useTheme } from "../../src/contexts/ThemeContext";
import { useWarranties } from "../../src/hooks/useWarranties";
import { useWarrantyForm } from "../../src/hooks/useWarrantyForm";
import { useSortPreferences } from "../../src/hooks/useSortPreferences";
import SearchIcon from "../../src/components/SearchIcon";
import SortIcon from "../../src/components/SortIcon";
import AddWarrantySheet from "../../src/components/AddWarrantySheet";
import WarrantyCardSkeleton from "../../src/components/WarrantyCardSkeleton";
import { getDefaultImageForCategory } from "../../src/utils/imageUtils";
import {
  getExpiryDate,
  getMonthsLeft,
  getRemainingPercentage,
} from "../../src/utils/dateUtils";
import Toast from "react-native-toast-message";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WarrantyCard = ({ item, colors }) => {
  const styles = getStyles(colors);
  const expiryDate = getExpiryDate(
    item.purchaseDate,
    item.warrantyLengthMonths
  );
  const monthsLeft = getMonthsLeft(expiryDate);
  const isExpired = expiryDate < new Date();


  const remainingPercentage = isExpired
    ? 0
    : getRemainingPercentage(item.purchaseDate, item.warrantyLengthMonths);


  const statusConfig = {
    active: {
      text: "Active",
      textColor: "#14532d", // Dark Green
      pillColor: "#f0fdf4", // Light Green
    },
    expiringSoon: {
      text: "Active",
      textColor: "#78350f", // Dark Amber
      pillColor: "#fffbeb", // Light Amber
    },
    expired: {
      text: "Expired",
      textColor: "#991b1b", // Dark Red
      pillColor: "#fef2f2", // Light Red
    },
  };

  const currentStatus = isExpired
    ? statusConfig.expired
    : remainingPercentage < 25
    ? statusConfig.expiringSoon
    : statusConfig.active;

  const dateLabel = isExpired ? "Expired on: " : "Expires on: ";

  const handlePress = () => {
    if (item && item.id) {
      router.push(`/warranty/${item.id}`);
    } else {
      console.error("Warranty item is missing an ID:", item);
    }
  };
  
  
  const imageSource = item.productImageUrl
    ? { uri: item.productImageUrl } 
    : getDefaultImageForCategory(item.category);

  return (
    <TouchableOpacity style={styles.cardContainer} onPress={handlePress}>
      <Image source={imageSource} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardDetails}>
        <View>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.productName}
          </Text>
          <Text style={styles.cardSubtitle}>
            {dateLabel}
            {expiryDate.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          {!isExpired && (
            <Text style={styles.cardMonthsLeft}>{monthsLeft} months left</Text>
          )}
          <View style={{ flex: 1 }} />

          <View
            style={[
              styles.statusPill,
              { backgroundColor: currentStatus.pillColor },
            ]}
          >
            <Text
              style={[styles.statusText, { color: currentStatus.textColor }]}
            >
              {currentStatus.text}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const HomeScreen = () => {
  const { theme, colors } = useTheme();
  const styles = getStyles(colors);

  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const searchInputRef = useRef(null);

  const {
    preferences,
    savePreferences,
    isLoaded: isPrefsLoaded,
  } = useSortPreferences();
  const {
    isLoading,
    processedData,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
  } = useWarranties(preferences);
  const { bottomSheetRef, isProcessing, handleStartAddFlow, formProps } =
    useWarrantyForm();

  const snapPoints = useMemo(() => ["90%"], []);

  const renderBackdrop = useCallback(
    (props) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        style={[props.style, { backgroundColor: "rgba(0, 0, 0, 0.6)" }]}
      />
    ),
    []
  );

  const toggleSearch = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsSearchVisible((prev) => !prev);
    if (isSearchVisible) setSearchQuery("");
  };

  useEffect(() => {
    if (isSearchVisible) searchInputRef.current?.focus();
  }, [isSearchVisible]);

  if (!isPrefsLoaded) {
    return (
      <SafeAreaView style={styles.wrapper}>
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const renderFilterTabs = () => (
    <View style={styles.filterContainer}>
      <TouchableOpacity
        style={[
          styles.filterTab,
          filterStatus === "all"
            ? styles.allTabActive
            : styles.filterTabInactive,
        ]}
        onPress={() => setFilterStatus("all")}
      >
        <Text
          style={[
            styles.filterText,
            filterStatus === "all"
              ? styles.allTextActive
              : styles.filterTextInactive,
          ]}
        >
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterTab,
          filterStatus === "active"
            ? styles.activeTabActive
            : styles.filterTabInactive,
        ]}
        onPress={() => setFilterStatus("active")}
      >
        <Text
          style={[
            styles.filterText,
            filterStatus === "active"
              ? styles.activeTextActive
              : styles.filterTextInactive,
          ]}
        >
          Active
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.filterTab,
          filterStatus === "expired"
            ? styles.expiredTabActive
            : styles.filterTabInactive,
        ]}
        onPress={() => setFilterStatus("expired")}
      >
        <Text
          style={[
            styles.filterText,
            filterStatus === "expired"
              ? styles.expiredTextActive
              : styles.filterTextInactive,
          ]}
        >
          Expired
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={require("../../assets/images/No_Data_Found.png")}
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.text}>
        {searchQuery || filterStatus !== "all"
          ? "No warranties found"
          : "Click the '+' icon to add your first eWarranty"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.wrapper}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <View style={styles.header}>
        {!isSearchVisible ? (
          <Image
            source={require("../../assets/images/EWarrants.png")}
            style={styles.logo}
          />
        ) : (
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search warranties..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
          />
        )}
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleSearch} style={styles.iconButton}>
            <SearchIcon size={26} color={colors.textSecondary} />
          </TouchableOpacity>
          <Menu>
            <MenuTrigger customStyles={{ triggerWrapper: styles.iconButton }}>
              <SortIcon size={26} color={colors.textSecondary} />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: styles.menuOptionsContainer,
                optionsWrapper: { backgroundColor: colors.card },
              }}
            >
              <Text style={styles.menuTitle}>Sort by</Text>
              <MenuOption
                onSelect={() =>
                  savePreferences({
                    ...preferences,
                    sortKey: "expiryDate",
                    sortOrder: "asc",
                  })
                }
              >
                <Text style={styles.menuOptionText}>
                  Expiry Date (Soonest First){" "}
                  {preferences.sortKey === "expiryDate" &&
                    preferences.sortOrder === "asc" &&
                    "✓"}
                </Text>
              </MenuOption>
              <MenuOption
                onSelect={() =>
                  savePreferences({
                    ...preferences,
                    sortKey: "purchaseDate",
                    sortOrder: "desc",
                  })
                }
              >
                <Text style={styles.menuOptionText}>
                  Purchase Date (Newest First){" "}
                  {preferences.sortKey === "purchaseDate" &&
                    preferences.sortOrder === "desc" &&
                    "✓"}
                </Text>
              </MenuOption>
              <MenuOption
                onSelect={() =>
                  savePreferences({
                    ...preferences,
                    sortKey: "productName",
                    sortOrder: "asc",
                  })
                }
              >
                <Text style={styles.menuOptionText}>
                  Alphabetical (A-Z){" "}
                  {preferences.sortKey === "productName" && "✓"}
                </Text>
              </MenuOption>
              <View style={styles.menuDivider} />
              <MenuOption
                onSelect={() =>
                  savePreferences({
                    ...preferences,
                    grouping:
                      preferences.grouping === "category" ? "none" : "category",
                  })
                }
              >
                <Text style={styles.menuOptionText}>
                  Group by Category {preferences.grouping === "category" && "✓"}
                </Text>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </View>
      </View>

      {isLoading ? (
        <View style={{ paddingHorizontal: 15, paddingTop: 10 }}>
          <WarrantyCardSkeleton />
          <WarrantyCardSkeleton />
          <WarrantyCardSkeleton />
        </View>
      ) : (
        <SectionList
          sections={processedData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WarrantyCard item={item} colors={colors} />
          )}
          renderSectionHeader={({ section: { title } }) => {
            if (preferences.grouping === "category") {
              return (
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeaderText}>{title}</Text>
                  <View style={styles.sectionHeaderLine} />
                </View>
              );
            }
            return null;
          }}
          ListHeaderComponent={renderFilterTabs}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 100 }}
          stickySectionHeadersEnabled={false}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={handleStartAddFlow}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
      <AddWarrantySheet
        bottomSheetRef={bottomSheetRef}
        snapPoints={snapPoints}
        renderBackdrop={renderBackdrop}
        useBottomSheetScroller={true}
        clearForm={formProps.clearForm}
        {...formProps}
      />
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={colors.primaryText} />
          <Text style={styles.processingText}>Analyzing Receipt...</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const getStyles = (colors) =>
  StyleSheet.create({
    wrapper: { flex: 1, backgroundColor: colors.background },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingTop: "30%",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 15,
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    logo: { height: 40, width: 140, resizeMode: "contain" },
    headerActions: { flexDirection: "row", alignItems: "center" },
    iconButton: { padding: 5, marginLeft: 10 },
    searchInput: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 15,
      fontSize: 16,
      color: colors.textPrimary,
    },
    image: { width: 200, height: 200, marginBottom: 20 },
    text: { fontSize: 16, color: colors.textSecondary, textAlign: "center" },
    fab: {
      position: "absolute",
      width: 60,
      height: 60,
      alignItems: "center",
      justifyContent: "center",
      right: 30,
      bottom: 30,
      backgroundColor: colors.primary,
      borderRadius: 30,
      elevation: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    fabIcon: { fontSize: 30, color: colors.primaryText },
    processingOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
    },
    processingText: {
      marginTop: 12,
      color: colors.primaryText,
      fontSize: 16,
      fontWeight: "500",
    },
    filterContainer: {
      flexDirection: "row",
      justifyContent: "flex-start",
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    filterTab: {
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 18,
      marginRight: 10,
    },
    filterTabInactive: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterText: { fontWeight: "600", fontSize: 14 },
    filterTextInactive: { color: colors.textPrimary },
    allTabActive: { backgroundColor: "#e0f2fe" },
    allTextActive: { color: "#0369a1" },
    activeTabActive: { backgroundColor: "#f0fdf4" },
    activeTextActive: { color: "#15803d" },
    expiredTabActive: { backgroundColor: "#fffbeb" },
    expiredTextActive: { color: "#b45309" },
    cardContainer: {
      backgroundColor: colors.card,
      borderRadius: 16,
      flexDirection: "row",
      marginBottom: 15,
      elevation: 2,
      shadowColor: "#475569",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    cardImage: {
      width: 90,
      height: 90,
      alignSelf: "center",
      margin: 12,
      borderRadius: 12,
      backgroundColor: colors.inputBackground,
    },
    cardDetails: {
      flex: 1,
      paddingVertical: 16,
      paddingRight: 16,
      justifyContent: "space-between",
    },
    cardTitle: {
      fontSize: 17,
      fontWeight: "bold",
      color: colors.textPrimary,
    },
    cardSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
    },
    bottomRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
    cardMonthsLeft: {
      fontSize: 14,
      color: colors.textPrimary,
      fontWeight: "500",
    },
    statusPill: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 6, // Sharper corners
    },
    statusText: {
      fontSize: 11,
      fontWeight: "600",
    },
    menuOptionsContainer: {
      borderRadius: 12,
      marginTop: 40,
      width: 250,
      backgroundColor: colors.card,
    },
    menuTitle: {
      fontSize: 14,
      fontWeight: "bold",
      color: colors.textSecondary,
      paddingHorizontal: 15,
      paddingTop: 15,
      paddingBottom: 5,
    },
    menuOptionText: {
      fontSize: 16,
      paddingHorizontal: 15,
      paddingVertical: 10,
      color: colors.textPrimary,
    },
    menuDivider: {
      height: 1,
      backgroundColor: colors.inputBackground,
      marginVertical: 5,
    },
    sectionHeaderContainer: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      marginTop: 10,
    },
    sectionHeaderText: {
      fontSize: 12,
      fontWeight: "bold",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginRight: 8,
    },
    sectionHeaderLine: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
  });

export default HomeScreen;
