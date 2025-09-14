import React from "react";
import { database } from "../db";

const DatabaseContext = React.createContext(null);

export const DatabaseProvider = ({ children }) => {
  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => {
  const db = React.useContext(DatabaseContext);
  if (db === null) {
    throw new Error("useDatabase must be used within a DatabaseProvider");
  }
  return db;
};
