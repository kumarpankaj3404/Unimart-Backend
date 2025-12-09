import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";

const checkRole = (allowedRole = []) => 
    asyncHandler(async (req,res,next) =>{
        const user = req.user

        if(!user || !user.role){
            throw new ApiError(401,"Unauthorized: No user or role not found")
        }

        if(!allowedRole.includes(user.role)){
            throw new ApiError(403,"Forbidden: You do not have access to this resource")
        }

        next();
    })

export default checkRole