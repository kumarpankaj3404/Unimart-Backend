import { Review } from "../models/review.models.js";
import { Order } from "../models/order.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addReview = asyncHandler(async (req, res) => {
    const { orderId, rating, comment } = req.body;
    console.log("ADD_REVIEW: Received review request", { orderId, rating });

    if (!orderId || !rating) {
        throw new ApiError(400, "OrderId and Rating are required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
        throw new ApiError(404, "Order not found");
    }

    if (order.status !== "delivered") {
        throw new ApiError(400, "You can only review delivered orders");
    }

    if (order.orderBy.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not authorized to review this order");
    }

    if (!order.deliveredBy) {
        throw new ApiError(400, "No delivery partner assigned to this order");
    }

    const existingReview = await Review.findOne({ orderId: orderId });
    if (existingReview) {
        throw new ApiError(400, "Review already exists for this order");
    }

    const review = await Review.create({
        rating,
        comment,
        orderId,
        deliveryPartnerId: order.deliveredBy,
        customerId: req.user._id
    });

    // Update Order to reflect it has been rated
    order.isRated = true;
    order.rating = rating;
    await order.save({ validateBeforeSave: false });
    console.log("ADD_REVIEW: Review saved and order updated", { isRated: order.isRated });

    return res
        .status(201)
        .json(new ApiResponse(201, review, "Review added successfully"));
});

export { addReview };
