import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { findAndRequestDriver } from "../services/driver.service.js";

const createNewOrder = asyncHandler(async (req, res) => {

    const { products, totalAmount, payment, address, lat, lng } = req.body;
    if (!products || !totalAmount || !payment || !address || !lat || !lng) {
        throw new ApiError(400, "Provide all the required fields (including address & location) to add a new Order")
    }

    const user = req.user._id;

    const newOrder = await Order.create({
        products,
        orderBy: user,
        totalAmount,
        payment,
        address: {
            fullAddress: address,
            lat,
            lng
        }
    })

    if (!newOrder) {
        throw new ApiError(500, "Something went wrong while creating order");
    }

    const io = req.app.get("io");

    // Trigger Driver Request Logic
    await findAndRequestDriver(newOrder._id, io);

    // Initial response doesn't have a deliveryAssigned (it's pending request)
    const deliveryAssigned = false;

    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                {
                    order: newOrder,
                    deliveryAssigned
                },
                deliveryAssigned
                    ? "Order created and delivery partner assigned"
                    : "Order created. Waiting for delivery partner"
            )
        )

})

const changeStatus = asyncHandler(async (req, res) => {
    const { orderId, newStatus } = req.body

    if (!orderId || !newStatus) {
        throw new ApiError(400, "OrderID or newStatus is required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(400, "Can't find order by Id provided");
    }



    order.status = newStatus;
    order.timeline.push({
        status: newStatus,
        description: `Order status updated to ${newStatus}`
    });

    const updateOrder = await order.save();

    if (!updateOrder) {
        throw new ApiError(400, "Can't find order by Id provided")
    }

    // Emit Real-time Update
    const io = req.app.get("io");
    io.to(orderId).emit("ORDER_UPDATED", updateOrder);

    return res
        .status(200)
        .json(
            new ApiResponse(200, updateOrder, "Order status successfully updated")
        )
})

const showAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("orderBy", "name email number");

    if (!orders) {
        throw new ApiError(500, "Something went wrong while fetching orders");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, orders, "Orders fetched successfully")
        )
})

const showOrderByUser = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const userOrders = await Order.find({ orderBy: userId }).sort({ createdAt: -1 });
    console.log(`FETCH_ORDERS: Found ${userOrders.length} orders for user ${userId}`);
    if (userOrders.length > 0) {
        console.log("FETCH_ORDERS: Sample order rating status:", {
            id: userOrders[0]._id,
            isRated: userOrders[0].isRated,
            rating: userOrders[0].rating
        });
    }

    if (!userOrders) {
        throw new ApiError(500, "Something went wrong while fetching orders");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, userOrders, "User Orders fetched successfully")
        )
})

const getMyDeliveries = asyncHandler(async (req, res) => {
    // Find orders where 'deliveredBy' matches the current delivery partner's ID
    const orders = await Order.find({ deliveredBy: req.user._id })
        .populate("orderBy", "name number address")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, orders, "My deliveries fetched"));
});

const getAvailableOrders = asyncHandler(async (req, res) => {
    // Find orders that are pending (waiting for delivery partner)
    const orders = await Order.find({
        status: "pending"
    })
        .populate("orderBy", "name address")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(
            new ApiResponse(200, orders, "Available orders fetched successfully")
        );
});

const acceptOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);

    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== "pending") {
        throw new ApiError(400, "Order is not available for acceptance");
    }

    order.deliveredBy = req.user._id;
    order.status = "processed";

    order.timeline.push({
        status: "processed",
        description: "Delivery partner accepted the order"
    });
    await order.save();

    // Notify the customer that driver is assigned
    const io = req.app.get("io");
    if (order.orderBy) {
        io.to(order.orderBy.toString()).emit("ORDER_UPDATED", {
            ...order.toObject(),
            status: "processed"
        });
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, order, "Order accepted successfully")
        );
});

export {
    createNewOrder,
    changeStatus,
    showAllOrders,
    showOrderByUser,
    getMyDeliveries,
    getAvailableOrders,
    acceptOrder
}