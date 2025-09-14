import { Model } from "@nozbe/watermelondb";
import { field, date, text, readonly } from "@nozbe/watermelondb/decorators";

export default class Warranty extends Model {
  static table = "warranties";

  @text("product_name") productName;
  @date("purchase_date") purchaseDate;
  @field("warranty_length_months") warrantyLengthMonths;
  @text("category") category;
  @text("description") description;
  @text("product_image_url") productImageUrl;
  @text("receipts_json") receiptsJson;
  @text("sync_status") syncStatus;
  @text("server_id") serverId;

  @readonly @date("created_at") createdAt;
  @readonly @date("updated_at") updatedAt;
}
