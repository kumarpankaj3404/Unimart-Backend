import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://unimart-asap.vercel.app',
    process.env.CORS_ORIGIN,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow non-browser clients (Postman/cURL/mobile apps) with no origin header.
        if (!origin) return callback(null, true);

        if (!allowedOrigins.includes(origin)) {
            return callback(new Error('The CORS policy for this site does not allow access from the specified Origin.'), false);
        }

        return callback(null, true);
    },
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());



//Routes
import userRoutes from "./routes/user.routes.js";
import orderRoutes from "./routes/order.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import reviewRoutes from "./routes/review.routes.js";

app.use("/api/v1/delivery", deliveryRoutes);


app.use("/api/v1/users", userRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/reviews", reviewRoutes);


// Custom Error Logger Middleware
app.use((err, req, res, next) => {
    console.error("🔥 GLOBAL ERROR CAUGHT:");
    console.error(err);
    if (err instanceof Error) {
        console.error("Stack:", err.stack);
    }
    next(err);
});

// Force Restart: 1
export { app };