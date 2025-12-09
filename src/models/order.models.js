import mongoose,{ Schema } from "mongoose";

const productSchema = new Schema({
    product:{
        type: String,
        required: true
    },
    thumbnail:{
        type: String
    },
    quantity:{
        type: Number,
        required: true,
        min: [1, "Quantity can not be less than 1"]
    },
    price:{
        type: Number,
        required: true,
        min: [0, "Price can not be negative"]
    }
},{id: false});

const counterSchema = new Schema({
  id: { type: String, required: true, unique: true }, // e.g., "orderNumber"
  seq: { type: Number, default: 0 },
  date: { type: String },
});
const Counter = mongoose.model("Counter", counterSchema);

const orderSchema = new Schema({
    products: [productSchema],
    totalAmount:{
        type: Number,
        required: true,
        min: [0, "Total amount can not be negative"]
    },
    orderBy:{
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    deliveredBy:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    status:{
        type: String,
        enum: ["pending", "processed", "shipped", "delivered", "cancelled"],
        default: "pending"
    },
    orderNumber:{
        type: String,
        unique: true
    },
    payment:{
        type: String,
        enum: ["online","cod"],
        required: true
    }
},{timestamps: true});

orderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    let counter = await Counter.findOne({ id: "orderNumber" });

    if (!counter || counter.date !== today) {
      // reset if no counter or it's a new day
      counter = await Counter.findOneAndUpdate(
        { id: "orderNumber" },
        { seq: 1, date: today },
        { new: true, upsert: true }
      );
    } else {
      // same day → increment
      counter = await Counter.findOneAndUpdate(
        { id: "orderNumber" },
        { $inc: { seq: 1 } },
        { new: true }
      );
    }

    const padded = String(counter.seq).padStart(4, "0");
    this.orderNumber = `ORD-${today.replace(/-/g, "")}-${padded}`;
  }
});

export const Order = mongoose.model("Order", orderSchema);