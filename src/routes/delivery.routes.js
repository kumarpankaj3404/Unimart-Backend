import express from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import {
  setDeliveryAvailability,
  markOrderDelivered,
  updateLiveLocation
} from "../controllers/delivery.controllers.js";
import checkRole from "../middleware/checkRole.middleware.js";

const router = express.Router();

// Delivery partner comes online / free
router.post(
  "/available",
  verifyJWT,
  checkRole(["delivery"]),
  setDeliveryAvailability
);

// 🔥 DELIVERY COMPLETES ORDER 
router.post(
  "/deliver/:orderId",
  verifyJWT,
  checkRole(["delivery"]),
  markOrderDelivered
);

router.post(
  "/location",
  verifyJWT,
  checkRole(["delivery"]),
  updateLiveLocation
);

export default router;
