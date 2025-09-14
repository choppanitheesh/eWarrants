import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";
import schema from "./schema";
import Warranty from "./Warranty";

const adapter = new SQLiteAdapter({
  schema,
  dbName: "eWarrantsDB",
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [Warranty],
});
