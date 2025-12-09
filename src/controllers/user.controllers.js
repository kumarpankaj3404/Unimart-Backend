import {User} from '../models/user.models.js';
import asyncHandler from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import {sendEmail} from '../utils/Mailer.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async(userId) =>{
    try {
        const user = await User.findById(userId);
        if(!user){
            throw new ApiError(500,"User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        if(!accessToken || !refreshToken){
            throw new ApiError(400,"accessToken and refreshToken not generated");
        }
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});

        return {accessToken,refreshToken};

    } catch (error) {
        throw new ApiError(500,error.message ||"Something went wrong while generating access or refreshToken");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const {username,email,password,number,role} = req.body;
    if(!username || !email || !password || !number){
        throw new ApiError(400, "All fields are required");
    }
    const existingUser = await User.findOne({email});
    if(existingUser){
        throw new ApiError(409, "User with this email already exists");
    }
    const user = await User.create({
        name: username,
        email,
        password,
        number,
        role
    });

    const userCreated = await User.findById(user._id).select('-password');
    
    if(!userCreated){
        throw new ApiError(500, "User registration failed");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    if(!accessToken || !refreshToken){
        throw new ApiError(500, "Token generation failed");
    }

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(201)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
        new ApiResponse(201, userCreated, "User registered successfully")
    );

})

const loginUser = asyncHandler(async (req, res) => {
    const {email, password} = req.body;
    if(!email || !password){
        throw new ApiError(400, "Email and password are required");
    }
    const user = await User.findOne({email}).select("+password");

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if(!isPasswordCorrect){
        throw new ApiError(401, "Invalid credentials");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);
    
    if(!accessToken || !refreshToken){
        throw new ApiError(500, "Token generation failed");
    }
    const options = {
        httpOnly: true,
        secure: true
    }
    
    const userData = await User.findById(user._id).select('-password');

    return res
    .status(200)
    .cookie('refreshToken', refreshToken, options)
    .cookie('accessToken', accessToken, options)
    .json(
        new ApiResponse(200,userData, "User logged in successfully")
    )
})

const logoutUser = asyncHandler(async (req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            refreshToken: undefined
        },{
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
        new ApiResponse(200, null, "User logged out successfully")
    )
})

const sendOtp = asyncHandler(async (req, res) => {
    const id = req.user._id;
    const user = await User.findOne({ _id: id });
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes

    await user.save({ validateBeforeSave: false });

    await sendEmail(
        user.email,
        "Your UNIMART OTP Verification",
        `<h1>Your OTP is: ${otp}</h1>
         <p>Valid for 5 minutes</p>`
    );

    const userData = await User.findById(user._id).select('-password');

    return res.status(200)
    .json(
        new ApiResponse(200, userData, "OTP sent to your email")
    );
});

const verifyOtp = asyncHandler(async (req, res) => {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user){
        throw new ApiError(404, "User not found");
    };

    if (!user.otp || !user.otpExpiry) {
        return res.status(400).json(
            new ApiResponse(400, null, "OTP not found, please request a new one")
        );
    }

    if (user.otp !== otp) {
        return res.status(400).json(
            new ApiResponse(400, null, "Invalid OTP")
        );
    }

    if (Date.now() > user.otpExpiry) {
        return res.status(400).json(
            new ApiResponse(400, null, "OTP has expired, please request a new one")
        );
    }

    user.isValidated = true;
    user.otp = undefined;
    user.otpExpiry = undefined;

    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json({ message: "Email verified successfully" });
});




export{
    registerUser,
    loginUser,
    logoutUser,
    sendOtp,
    verifyOtp
}