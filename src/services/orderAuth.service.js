import { Order } from "../models/order.models.js";
import { ApiError } from "../utils/ApiError.js";

export const validateOrderAccess = async (orderId, user) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new ApiError(404, "Order not found");
  }

  const isCustomer =
    order.orderBy.toString() === user._id.toString();

  const isDeliveryPartner =
    order.deliveredBy &&
    order.deliveredBy.toString() === user._id.toString();

  if (!isCustomer && !isDeliveryPartner) {
    throw new ApiError(403, "You are not allowed to access this order");
  }

  return order;
};
