import { appSchema, tableSchema } from "@nozbe/watermelondb";

export default appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: "warranties",
      columns: [
        { name: "product_name", type: "string" },
        { name: "purchase_date", type: "number" },
        { name: "warranty_length_months", type: "number" },
        { name: "category", type: "string", isOptional: true },
        { name: "description", type: "string", isOptional: true },
        { name: "product_image_url", type: "string", isOptional: true },
        { name: "receipts_json", type: "string", isOptional: true },
        { name: "sync_status", type: "string" },
        {
          name: "server_id",
          type: "string",
          isOptional: true,
          isIndexed: true,
        },
        { name: "created_at", type: "number" },
        { name: "updated_at", type: "number" },
      ],
    }),
  ],
});
