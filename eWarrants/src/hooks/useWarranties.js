import { useState, useEffect } from "react";
import { useDatabase } from "../contexts/DatabaseContext";
import { Q } from "@nozbe/watermelondb";
import { getExpiryDate } from "../utils/dateUtils";

export const useWarranties = (preferences) => {
  const database = useDatabase();
  const [rawWarranties, setRawWarranties] = useState([]);
  const [processedData, setProcessedData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    const warrantiesCollection = database.collections.get("warranties");
    const subscription = warrantiesCollection
      .query(Q.where("sync_status", Q.notEq("deleted")))
      .observeWithColumns(["product_name", "category", "purchase_date"]) 
      .subscribe((allWarranties) => {
        setRawWarranties(allWarranties);
        setIsLoading(false);
      });

    return () => subscription.unsubscribe();
  }, [database]);

  useEffect(() => {
    let result = rawWarranties;

    if (searchQuery) {
      result = result.filter((warranty) =>
        warranty.productName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      result = result.filter((warranty) => {
        const expiryDate = getExpiryDate(
          warranty.purchaseDate,
          warranty.warrantyLengthMonths
        );
        const isExpired = expiryDate < new Date();
        return filterStatus === "active" ? !isExpired : isExpired;
      });
    }

    result.sort((a, b) => {
      let valA, valB;
      switch (preferences.sortKey) {
        case "expiryDate":
          valA = getExpiryDate(
            a.purchaseDate,
            a.warrantyLengthMonths
          ).getTime();
          valB = getExpiryDate(
            b.purchaseDate,
            b.warrantyLengthMonths
          ).getTime();
          break;
        case "purchaseDate":
          valA = a.purchaseDate.getTime();
          valB = b.purchaseDate.getTime();
          break;
        case "productName":
        default:
          valA = a.productName.toLowerCase();
          valB = b.productName.toLowerCase();
          break;
      }
      if (valA < valB) return preferences.sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return preferences.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    if (preferences.grouping === "category") {
      const grouped = result.reduce((acc, warranty) => {
        const category = warranty.category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(warranty);
        return acc;
      }, {});

      const sections = Object.keys(grouped)
        .sort()
        .map((category) => ({
          title: category,
          data: grouped[category],
        }));
      setProcessedData(sections);
    } else {
      setProcessedData(
        result.length > 0 ? [{ title: "All", data: result }] : []
      );
    }
  }, [rawWarranties, searchQuery, filterStatus, preferences]);

  return {
    isLoading,
    processedData,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
  };
};
