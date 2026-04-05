import express from "express";
import cors from "cors"
import {config} from "dotenv";
import {connectDB} from  "./config/db.config.js"

//Import user Routes
import authRoute from "./modules/auth/auth.route.js"
import cookieParser from "cookie-parser";
import AppError from "./utils/appError.js";
import {globalMiddleware} from "../src/middleware/error.middleware.js"

config();
connectDB();

import adminRoutes from "./modules/admin/admin.routes.js";


const app = express();

app.use(cors({
  origin: "http://localhost:5173", // your frontend
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//API routes
app.use("/api/auth",authRoute)
app.use("/api/admin", adminRoutes);

app.all("/{*path}", (req, res, next) => {
  next(new AppError(`Can't find ${req.url} on this server`, 404));
});

app.use(globalMiddleware)

export default app;