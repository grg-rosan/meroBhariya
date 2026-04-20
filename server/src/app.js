import express from "express";
import cors from "cors"
import {config} from "dotenv";
import {connectDB} from  "./config/db.config.js"

//Import user Routes
import AppError from "./utils/error/appError.js";
import cookieParser from "cookie-parser";
import {globalMiddleware} from "./middlewares/error.middleware.js"

config();
connectDB();
import authRoutes from "./modules/auth/auth.route.js"
import adminRoutes from "./modules/admin/admin.routes.js";
import dispatcherRoutes from "./modules/dispatcher/dispatcher.route.js"
import merchantRoutes from "./modules/merchant/shipment/shipment.route.js"
import riderRoutes from "./modules/rider/rider.route.js"

const app = express();

app.use(cors({
  origin: "http://localhost:5173", // your frontend
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


//API routes
app.use("/api/auth",authRoutes)
app.use("/api/admin", adminRoutes);
app.use("/api/dispatcher",dispatcherRoutes)
app.use("/api/rider",riderRoutes)
app.use("/api/merchant",merchantRoutes)

app.all("/{*path}", (req, res, next) => {
  next(new AppError(`Can't find ${req.url} on this server`, 404));
});

app.use(globalMiddleware)

export default app;