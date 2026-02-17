import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";

// Basic FCFS Queue Assignment
export const assignQueuedOrder = async (deliveryPartnerId) => {
  try {
    // 1. Find oldest PENDING order that has NO delivery partner
    const pendingOrder = await Order.findOneAndUpdate(
      {
        status: "pending",
        deliveredBy: { $exists: false }
      },
      {
        $set: {
          deliveredBy: deliveryPartnerId,
          status: "processed"
        }
      },
      {
        sort: { createdAt: 1 }, // FIFO
        new: true
      }
    );

    if (!pendingOrder) return null;

    // 2. Mark delivery partner as BUSY (unavailable)
    await User.findByIdAndUpdate(deliveryPartnerId, {
      isAvailable: false
    });

    return pendingOrder;

  } catch (error) {
    console.error("Order Queue Error:", error);
    return null;
  }
};
