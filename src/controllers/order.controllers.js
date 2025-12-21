import { Order } from "../models/order.models.js";
import { User } from "../models/user.models.js";
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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

    const deliveryPartner = await User.findOne({
        role: "delivery",
        isAvailable: true
    });

    let deliveryAssigned = false;

    if (deliveryPartner) {
        newOrder.deliveredBy = deliveryPartner._id;
        newOrder.status = "processed";
        await newOrder.save();

        deliveryPartner.isAvailable = false;
        await deliveryPartner.save();

        deliveryAssigned = true;

        const io = req.app.get("io");
        io.to(deliveryPartner._id.toString()).emit(
            "NEW_DELIVERY_ASSIGNMENT",
            newOrder
        );
    }

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

    const updateOrder = await Order.findByIdAndUpdate(
        orderId,
        {
            status: newStatus
        },
        { new: true }
    )

    if (!updateOrder) {
        throw new ApiError(400, "Can't find order by Id provided")
    }

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
    // Find orders where 'deliveredBy' matches the logged-in user
    const orders = await Order.find({ deliveredBy: req.user._id })
        .populate("orderBy", "name number address")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, orders, "My deliveries fetched"));
});



export {
    createNewOrder,
    changeStatus,
    showAllOrders,
    showOrderByUser,
    getMyDeliveries
}