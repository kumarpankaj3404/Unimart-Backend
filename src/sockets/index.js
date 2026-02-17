import { Server } from "socket.io";
import { User } from "../models/user.models.js";
import { socketAuth } from "../middleware/socketAuth.middleware.js";
import { validateOrderAccess } from "../services/orderAuth.service.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });


  io.use(socketAuth);

  io.on("connection", (socket) => {
    console.log(
      "🔐 Socket connected:",
      socket.user._id.toString(),
      socket.user.role
    );

    // Personal room
    socket.join(socket.user._id.toString());

    //JOIN ORDER ROOM
    socket.on("JOIN_ORDER", async ({ orderId }) => {
      try {
        await validateOrderAccess(orderId, socket.user);
        socket.join(orderId);

        socket.emit("JOIN_ORDER_SUCCESS", {
          orderId
        });
      } catch (error) {
        socket.emit("JOIN_ORDER_ERROR", {
          message: error.message
        });
      }
    });

    //LIVE LOCATION UPDATE (DELIVERY ONLY)

    socket.on("LOCATION_UPDATE", async ({ orderId, lat, lng }) => {
      try {
        // Only delivery partner can send GPS
        if (socket.user.role !== "delivery") {
          throw new Error("Only delivery partner can send location");
        }

        if (!lat || !lng) {
          throw new Error("Location coordinates required");
        }

        // Validate order access
        await validateOrderAccess(orderId, socket.user);

        // Save location to DB
        await User.findByIdAndUpdate(socket.user._id, {
          location: {
            type: "Point",
            coordinates: [lng, lat]
          }
        });

        // Broadcast to order room
        io.to(orderId).emit("DELIVERY_LOCATION_UPDATE", {
          orderId,
          lat,
          lng,
          updatedAt: new Date()
        });
      } catch (error) {
        socket.emit("LOCATION_ERROR", {
          message: error.message
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected:", socket.user._id.toString());
    });
  });

  return io;
};
