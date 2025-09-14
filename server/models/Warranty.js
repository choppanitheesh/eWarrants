const mongoose = require("mongoose");

const WarrantySchema = new mongoose.Schema(
  {
    productName: { type: String, required: true },
    purchaseDate: { type: Date, required: true },
    warrantyLengthMonths: { type: Number, required: true },
    category: { type: String },
    description: { type: String },
    receipts: [
      {
        name: { type: String, required: true },
        url: { type: String, required: true },
        fileType: { type: String, required: true },
      },
    ],
    productImageUrl: { type: String },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

WarrantySchema.statics.findExpiring = function (userId, days) {
  const today = new Date();
  const targetDate = new Date();
  targetDate.setDate(today.getDate() + days);
  return this.find({
    user: userId,
    $expr: {
      $and: [
        {
          $lte: [
            {
              $dateAdd: {
                startDate: "$purchaseDate",
                unit: "month",
                amount: "$warrantyLengthMonths",
              },
            },
            targetDate,
          ],
        },
        {
          $gte: [
            {
              $dateAdd: {
                startDate: "$purchaseDate",
                unit: "month",
                amount: "$warrantyLengthMonths",
              },
            },
            today,
          ],
        },
      ],
    },
  }).lean();
};

const Warranty = mongoose.model("Warranty", WarrantySchema);

module.exports = Warranty;
