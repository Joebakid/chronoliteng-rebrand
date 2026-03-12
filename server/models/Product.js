import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true },
    image: { type: String },
    images: {
      type: [String],
      default: [],
    },
    brand: { type: String },
    category: { type: String },
    collection: { type: String },
    strap: { type: String },
    movement: { type: String },
    caseSize: { type: String },
    strapColor: { type: String },
    dialColor: { type: String },
    countInStock: { type: Number, default: 0 },
    description: { type: String },
    colors: {
      type: [String],
      default: []
    }
  },
  { timestamps: true }
);

export default mongoose.model("Product", productSchema);
