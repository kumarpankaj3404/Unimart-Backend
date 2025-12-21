import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import { assignQueuedOrder } from "../services/orderQueue.service.js";

/**
 * 📦 DELIVERY PARTNER MARKS ORDER AS DELIVERED
 */
const markOrderDelivered = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const deliveryPartnerId = req.user._id;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (
    !order.deliveredBy ||
    order.deliveredBy.toString() !== deliveryPartnerId.toString()
  ) {
    throw new ApiError(403, "You are not allowed to complete this order");
  }

  order.status = "delivered";
  await order.save();

  const deliveryPartner = await User.findById(deliveryPartnerId);
  deliveryPartner.isAvailable = true;
  await deliveryPartner.save();

  const nextOrder = await assignQueuedOrder(deliveryPartnerId);

  if (nextOrder) {
    const io = req.app.get("io");
    io.to(deliveryPartnerId.toString()).emit(
      "NEW_ORDER_ASSIGNED",
      nextOrder
    );
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        deliveredOrder: order,
        nextOrderAssigned: !!nextOrder
      },
      "Order delivered successfully"
    )
  );
});

/**
 * 🚴 DELIVERY PARTNER SETS AVAILABILITY
 */
const setDeliveryAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;

  if (typeof isAvailable !== "boolean") {
    throw new ApiError(400, "isAvailable must be true or false");
  }

  const deliveryPartner = await User.findById(req.user._id);
  if (!deliveryPartner) {
    throw new ApiError(404, "Delivery partner not found");
  }

  deliveryPartner.isAvailable = isAvailable;
  await deliveryPartner.save();

  // 🔥 If becoming available → auto assign order
  let assignedOrder = null;
  if (isAvailable) {
    assignedOrder = await assignQueuedOrder(req.user._id);

    if (assignedOrder) {
      const io = req.app.get("io");
      io.to(req.user._id.toString()).emit(
        "NEW_ORDER_ASSIGNED",
        assignedOrder
      );
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isAvailable,
        assignedOrder
      },
      "Availability updated successfully"
    )
  );
});


const updateLiveLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude, orderId } = req.body;

  if (!latitude || !longitude || !orderId) {
    throw new ApiError(400, "latitude, longitude, orderId required");
  }

  // update delivery partner location
  await User.findByIdAndUpdate(req.user._id, {
    location: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  });

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const io = req.app.get("io");

  // emit ONLY to customer
  io.to(order.orderBy.toString()).emit(
    "DELIVERY_LOCATION_UPDATE",
    { latitude, longitude }
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Location updated")
  );
});


export {
  markOrderDelivered,
  setDeliveryAvailability,
  updateLiveLocation
};
