import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

export const socketAuth = async (socket, next) => {
  try {
    // Token can come from auth object or headers
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new ApiError(401, "Socket authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    if (!decoded) {
      return next(new ApiError(401, "Invalid socket token"));
    }

    const user = await User.findById(decoded._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      return next(new ApiError(404, "Socket user not found"));
    }

    // Attach user to socket
    socket.user = user;

    next();
  } catch (error) {
    return next(new ApiError(401, "Unauthorized socket connection"));
  }
};
