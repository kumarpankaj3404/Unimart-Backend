import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";

import jwt from "jsonwebtoken";

const verifyJWT = asyncHandler(async (req,res,next) =>{
    try {
        const token = req.cookies.accessToken || req.headers.authorization?.split(" ")[1];
    
        if(!token){
            throw new ApiError(401, "You are not authorized to access this resource");
        }
    
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        if(!decoded){
            throw new ApiError(401, "Invalid token");
        }
    
        const user = await User.findById(decoded._id).select("-refreshToken -password");
        if(!user){
            throw new ApiError(404, "User not found");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized access and something went wrong");
    }

})

export { verifyJWT };