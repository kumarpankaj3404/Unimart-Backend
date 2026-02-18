import { User } from "../models/user.models.js";
import { Order } from "../models/order.models.js";

/**
 * Finds an available driver for the order who hasn't rejected it yet.
 * @param {string} orderId
 * @param {object} io - Socket.io instance
 */
export const findAndRequestDriver = async (orderId, io) => {
    try {
        const order = await Order.findById(orderId);
        if (!order) return null;

        // Find a driver who:
        // 1. Is 'delivery' role
        // 2. Is available
        // 3. Is NOT in the rejectedDrivers list
        // 4. (Optional) Is NOT the one currently requested (though usually we clear this before calling)

        const rejectedIds = order.rejectedDrivers || [];

        const driver = await User.findOne({
            role: "delivery",
            isAvailable: true,
            _id: { $nin: rejectedIds }
        });

        if (!driver) {
            console.log(`No available drivers found for order ${orderId}`);
            // Optionally: emit event to Admin or User saying "Searching for drivers..."
            order.requestedDriver = null; // Clear request if no one found
            await order.save();
            return null;
        }

        // Assign as Requested (NOT DeliveredBy yet)
        order.requestedDriver = driver._id;
        await order.save();

        console.log(`Requesting driver ${driver.name} for order ${orderId}`);

        // Emit Request Event to specific driver
        io.to(driver._id.toString()).emit("DELIVERY_REQUEST", order);

        return driver;

    } catch (error) {
        console.error("Error in findAndRequestDriver:", error);
        return null;
    }
};

/**
 * Finds the next pending order for a driver
 * @param {string} driverId
 */
export const findNextOrderForDriver = async (driverId) => {
    // Simple logic: Find oldest pending order not rejected by this driver
    console.log("Searching for queued order for driver:", driverId);
    const order = await Order.findOne({
        status: "pending",
        requestedDriver: null,
        rejectedDrivers: { $ne: driverId }
    }).sort({ createdAt: 1 });

    if (order) {
        return order;
    }
    return null;
};
