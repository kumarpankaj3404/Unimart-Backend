import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import { findAndRequestDriver, findNextOrderForDriver } from "../services/driver.service.js";





const markOrderDelivered = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const deliveryPartnerId = req.user._id;

  try {
    const order = await Order.findById(orderId);
    if (!order) throw new ApiError(404, "Order not found");
    if (
      !order.deliveredBy ||
      order.deliveredBy.toString() !== deliveryPartnerId.toString()
    ) {
      throw new ApiError(403, "You are not allowed to complete this order");
    }
    order.status = "delivered";
    order.timeline.push({
      status: "delivered",
      description: "Order delivered successfully"
    });
    await order.save();

    const deliveryPartner = await User.findById(deliveryPartnerId);
    if (!deliveryPartner) {
      throw new ApiError(404, "User not found");
    }
    deliveryPartner.isAvailable = true;
    await deliveryPartner.save();

    let nextOrder = null;

    try {
      nextOrder = await findNextOrderForDriver(deliveryPartnerId);

      const io = req.app.get("io");

      io.to(orderId).emit("ORDER_UPDATED", order);

      if (nextOrder) {
        // Notify Driver
        io.to(deliveryPartnerId.toString()).emit(
          "NEW_ORDER_ASSIGNED",
          nextOrder
        );
        // Notify Customer that driver is assigned
        if (nextOrder.orderBy) {
          io.to(nextOrder.orderBy.toString()).emit(
            "NEW_DELIVERY_ASSIGNMENT",
            nextOrder
          );
        } else {
          console.error("Next Order missing orderBy:", nextOrder._id);
        }
      }
    } catch (error) {
      console.error("Error in post-completion logic:", error);
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
  } catch (error) {
    console.error("CRITICAL ERROR in markOrderDelivered:", error);
    // If it's an ApiError, rethrow it so standard handler catches it
    if (error instanceof ApiError) throw error;
    // Otherwise wrap it
    throw new ApiError(500, "Internal Server Error during delivery completion");
  }
});


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


  if (isAvailable) {
    // Find valid pending order to Request (simple logic: find one pending order)
    // In real app, you'd find nearest pending order
    const pendingOrder = await Order.findOne({ status: "pending", requestedDriver: null });
    if (pendingOrder) {
      const io = req.app.get("io");
      await findAndRequestDriver(pendingOrder._id, io);
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        isAvailable
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


  await User.findByIdAndUpdate(req.user._id, {
    location: {
      type: "Point",
      coordinates: [longitude, latitude]
    }
  });

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  const io = req.app.get("io");

  io.to(order.orderBy.toString()).emit(
    "DELIVERY_LOCATION_UPDATE",
    { latitude, longitude }
  );

  return res.status(200).json(
    new ApiResponse(200, null, "Location updated")
  );
});

const rejectOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const deliveryPartnerId = req.user._id;

  const order = await Order.findById(orderId);
  if (!order) throw new ApiError(404, "Order not found");

  if (order.requestedDriver && order.requestedDriver.toString() !== deliveryPartnerId.toString()) {
    throw new ApiError(400, "You are not the requested driver for this order");
  }

  // Add to rejected list
  order.rejectedDrivers.push(deliveryPartnerId);

  // Clear current request
  order.requestedDriver = null;
  await order.save();

  // Trigger search for next driver
  const io = req.app.get("io");
  await findAndRequestDriver(orderId, io);

  return res.status(200).json(
    new ApiResponse(200, null, "Order rejected. Searching for next driver.")
  );
});


export {
  markOrderDelivered,
  setDeliveryAvailability,
  updateLiveLocation,
  rejectOrder
};
