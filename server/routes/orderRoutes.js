import express from "express";
import protect, { adminOnly } from "../middleware/authMiddleware.js";
import { createOrder, getAdminOrders } from "../controllers/orderController.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/", protect, adminOnly, getAdminOrders);

export default router;
