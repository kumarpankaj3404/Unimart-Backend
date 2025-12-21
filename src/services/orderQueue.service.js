import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";

export const assignQueuedOrder = async (deliveryPartnerId) => {
  // Find oldest pending order
  const order = await Order.findOne({
    status: "pending",
    deliveredBy: { $exists: false }
  }).sort({ createdAt: 1 });

  if (!order) return null;

  // Assign delivery partner
  order.deliveredBy = deliveryPartnerId;
  order.status = "processed";
  await order.save();

  // Mark delivery partner busy
  await User.findByIdAndUpdate(deliveryPartnerId, {
    isAvailable: false
  });

  return order;
};
