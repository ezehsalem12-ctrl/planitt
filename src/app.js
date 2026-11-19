import express from "express";
import dotenv from "dotenv";
import userRoute from "./routes/userRoute.js";
import eventRoute from "./routes/eventRoute.js";
import registrationRoute from "./routes/registrationRoute.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import staffRoute from "./routes/staffRoute.js";
import adminRoute from "./routes/adminRoutes.js";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";

dotenv.config();

const app = express();

app.use(express.json());

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Authentication routes
app.use("/api/user", userRoute);

// Event routes
app.use("/api/events", eventRoute);

// Attendee registration routes
app.use("/api/registrations", registrationRoute);

// Staff management and authentication routes
app.use("/api/staff", staffRoute);

// Admin dashboard and management routes
app.use("/api/admin", adminRoute);

// Global error middleware
app.use(errorMiddleware);

export default app;
