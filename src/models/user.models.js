import jwt from "jsonwebtoken";
import mongoose, { Schema } from "mongoose";
import bcrypt from "bcrypt";

// --- 1. Create a Sub-Schema for Addresses ---
const addressSchema = new Schema({
    fullAddress: {
        type: String,
        required: true,
        trim: true
    },
    label: {
        type: String,
        default: "Home" // e.g., Home, Work, Other
    },
    coordinates: {
        lat: Number,
        lng: Number
    }
}, { _id: true }); // _id: true allows us to delete specific addresses later

const productSchema = new Schema({
    product: { type: String, required: true },
    thumbnail: { type: String },
    price: { type: Number, required: true, min: [0, "Price can not be negative"] }
}, { id: false });

const userSchema = new Schema({
    name: {
        type: String,
        required: [true, "Name is required"],
        maxLength: [50, "Name must be less than 50 characters"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minLength: [6, "Password must be at least 6 characters"],
        select: false
    },
    number: {
        type: Number,
        required: true,
        unique: [true, "Number must be unique"]
    },
    role: {
        type: String,
        enum: ["user", "admin", "delivery"],
        required: true,
        default: "user"
    },
    
    // --- 2. Update address field to use the array schema ---
    address: {
        type: [addressSchema], 
        default: []
    },

    refreshToken: { type: String },
    isValidated: { type: Boolean, default: false },
    otp: { type: String },
    otpExpiry: { type: Date },
    isAvailable: { type: Boolean, default: true },
    
    // This 'location' is the user's CURRENT active location (for live tracking)
    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    favItems: [productSchema]
}, { timestamps: true });

userSchema.index({ location: "2dsphere" });

userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
    if (!this.password) throw new Error("Password is required for comparison");
    return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id: this._id,
        role: this.role,
        name: this.name,
    }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
};

userSchema.methods.generateRefreshToken = function () {
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
};

export const User = mongoose.model("User", userSchema);