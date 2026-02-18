import mongoose, { Schema } from "mongoose";

const reviewSchema = new Schema(
    {
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String,
            trim: true
        },
        orderId: {
            type: Schema.Types.ObjectId,
            ref: "Order",
            required: true
        },
        deliveryPartnerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        customerId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    { timestamps: true }
);

export const Review = mongoose.model("Review", reviewSchema);
