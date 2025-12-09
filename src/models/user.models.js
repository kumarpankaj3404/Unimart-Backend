import jwt from "jsonwebtoken";
import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt";

const userSchema = new Schema({
    name:{
        type: String,
        required: [true, "Name is required"],
        maxLength: [50, "Name must be less than 50 characters"],
        trim: true
    },
    email:{
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true
    },
    password:{
        type: String,
        required: [true, "Password is required"],
        minLength: [6,"Password must be at least 6 characters"],
        select: false // do not return password field by default
    },
    number:{
        type: Number,
        required: true,
        unique: [true, "Number must be unique"]
    },
    role:{
        type: String,
        enum: ["user", "admin","delivery"],
        required: true,
        default: "user"
    },
    address:{
        type: String,
        default: "",
        maxLength: [200, "Address must be less than 200 characters"]
    },
    refreshToken:{
        type: String
    },
    isValidated:{
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpiry: {
        type: Date
    }
},{timestamps: true})

userSchema.pre("save", async function(){
    if(!this.isModified("password")){
        return;
    }
    this.password = await bcrypt.hash(this.password,10); // salt rounds = 10
})


userSchema.methods.isPasswordCorrect = async function(password){
    if(!this.password){
        throw new Error("Password is required for comaprison");
    }
    return await bcrypt.compare(password,this.password);
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign({
        _id: this._id,
        role: this.role,
        name: this.name,
    }, process.env.ACCESS_TOKEN_SECRET,{
        expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    });
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id: this._id
    }, process.env.REFRESH_TOKEN_SECRET,{
        expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    });
}

export const User = mongoose.model("User",userSchema);
