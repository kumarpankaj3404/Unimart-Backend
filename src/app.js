import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({limit: '1mb'}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());



//Routes
import userRoutes from "./routes/user.routes.js";
import orderRoutes from "./routes/order.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";

app.use("/api/v1/delivery", deliveryRoutes);


app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);



export {app};