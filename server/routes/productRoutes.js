import express from "express";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
  getProducts,
  getProductAnalytics,
  getProductCategories,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/categories", getProductCategories);
router.get("/analytics/overview", protect, adminOnly, getProductAnalytics);
router.get("/:slug", getProduct);
router.post("/", protect, adminOnly, upload.array("images", 6), createProduct);
router.put("/:id", protect, adminOnly, upload.array("images", 6), updateProduct);
router.delete("/:id", protect, adminOnly, deleteProduct);

export default router;
