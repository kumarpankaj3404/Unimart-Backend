import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json({limit: '1mb'}));

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(cookieParser());


const app = express();

export {app};