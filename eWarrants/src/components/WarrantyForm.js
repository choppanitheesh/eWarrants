import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

import { useTheme } from "../contexts/ThemeContext";
import { getComponentStyles } from "../theme/componentStyles";
import { CATEGORIES } from "../constants/categories";

const WarrantyForm = ({
  formTitle,
  productName,
  category,
  purchaseDate,
  warrantyMonths,
  description,
  receipts = [],
  showDatePicker,
  setProductName,
  setCategory,
  setPurchaseDate,
  setWarrantyMonths,
  setDescription,
  setShowDatePicker,
  onDateChange,
  handleAddReceipt,
  handleRemoveReceipt,
  handleSave,
  isSaving = false,
  isUploading = false,
}) => {
  const { colors } = useTheme();
  const componentStyles = getComponentStyles(colors);
  const styles = getLocalStyles(colors, componentStyles);

  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);

  const handleSelectCategory = (selectedCategory) => {
    setCategory(selectedCategory);
    setCategoryModalVisible(false);
  };

  return (
    <>
      <View style={styles.container}>
        {formTitle && <Text style={styles.formTitle}>{formTitle}</Text>}

        <Text style={componentStyles.label}>Product Name</Text>
        <TextInput
          style={componentStyles.input}
          placeholder="e.g., Sony Headphones"
          placeholderTextColor={colors.textSecondary}
          value={productName}
          onChangeText={setProductName}
        />

        <Text style={componentStyles.label}>Category</Text>
        <TouchableOpacity
          style={componentStyles.input}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text
            style={[styles.selectorText, !category && styles.placeholderText]}
          >
            {category || "Select a category..."}
          </Text>
        </TouchableOpacity>

        <Text style={componentStyles.label}>Purchase Date</Text>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {purchaseDate.toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={purchaseDate}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        <Text style={componentStyles.label}>Warranty Period (in months)</Text>
        <TextInput
          style={componentStyles.input}
          placeholder="e.g., 12"
          placeholderTextColor={colors.textSecondary}
          value={warrantyMonths}
          onChangeText={setWarrantyMonths}
          keyboardType="numeric"
        />

        <Text style={componentStyles.label}>Description (Optional)</Text>
        <TextInput
          style={[
            componentStyles.input,
            { height: 100, textAlignVertical: "top" },
          ]}
          placeholder="e.g., Serial number, notes..."
          placeholderTextColor={colors.textSecondary}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={componentStyles.label}>
          Attached Files ({receipts.length} / 3)
        </Text>
        <View style={styles.receiptsContainer}>
          {receipts.map((receipt, index) => (
            <View key={index} style={styles.receiptItem}>
              <Text style={styles.receiptName} numberOfLines={1}>
                {receipt.name}
              </Text>
              <TouchableOpacity onPress={() => handleRemoveReceipt(index)}>
                <Text style={componentStyles.destructiveButtonText}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          {isUploading ? (
            <ActivityIndicator
              style={{ marginVertical: 10 }}
              color={colors.primary}
            />
          ) : (
            receipts.length < 3 && (
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddReceipt}
              >
                <Text style={styles.addButtonText}>+ Add another file</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        <TouchableOpacity
          style={[componentStyles.button, { marginTop: 20 }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={componentStyles.buttonText}>Save Warranty</Text>
          )}
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isCategoryModalVisible}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select a Category</Text>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.categoryItem}
                  onPress={() => handleSelectCategory(item)}
                >
                  <Text style={styles.categoryItemText}>{item}</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setCategoryModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};

const getLocalStyles = (colors, componentStyles) =>
  StyleSheet.create({
    container: { paddingHorizontal: 20, paddingBottom: 40 },
    formTitle: {
      fontSize: 22,
      fontWeight: "bold",
      textAlign: "center",
      marginBottom: 24,
      color: colors.textPrimary,
    },
    datePickerButton: { ...componentStyles.input },
    selectorText: { fontSize: 16, color: colors.textPrimary },
    placeholderText: { color: colors.textSecondary },
    modalOverlay: {
      flex: 1,
      justifyContent: "flex-end",
      backgroundColor: "rgba(0,0,0,0.6)",
    },
    modalContent: {
      backgroundColor: colors.card,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      maxHeight: "60%",
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: colors.textPrimary,
      marginBottom: 20,
      textAlign: "center",
    },
    categoryItem: {
      paddingVertical: 15,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    categoryItemText: { fontSize: 18, color: colors.textPrimary },
    closeButton: {
      ...componentStyles.button,
      marginTop: 20,
      backgroundColor: colors.inputBackground,
    },
    closeButtonText: {
      ...componentStyles.buttonText,
      color: colors.textPrimary,
    },
    receiptsContainer: {
      backgroundColor: colors.inputBackground,
      borderRadius: 10,
      padding: 10,
      borderColor: colors.border,
      borderWidth: 1,
    },
    receiptItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 8,
      marginBottom: 8,
    },
    receiptName: { flex: 1, marginRight: 10, color: colors.textPrimary },
    addButton: {
      paddingVertical: 12,
      alignItems: "center",
      backgroundColor: colors.border,
      borderRadius: 8,
    },
    addButtonText: { color: colors.textSecondary, fontWeight: "600" },
  });

export default WarrantyForm;
