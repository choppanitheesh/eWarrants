import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import CloseIcon from "../components/CloseIcon";

const AddWarrantyScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.sheet}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add New Warranty</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <CloseIcon size={28} />
            </TouchableOpacity>
          </View>

        
          <View style={styles.content}>
            <Text>The form fields for adding a warranty will go here.</Text>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end", 
    backgroundColor: "rgba(0, 0, 0, 0.5)", 
  },
  sheet: {
    height: "95%", 
    width: "100%",
    backgroundColor: "white",
    borderTopLeftRadius: 20, 
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
});

export default AddWarrantyScreen;
