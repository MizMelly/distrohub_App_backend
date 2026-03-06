// api/index.js

import express from "express";
import cors from "cors";

// Import all routes
import authRoutes from "../src/routes/auth.js";
import productsRoutes from "../src/routes/products.js";
import ordersRoutes from "../src/routes/orders.js";
import ordersHistoryRoutes from "../src/routes/orders-history.js";
import bankAccountsRoutes from "../src/routes/bank-accounts.js";
import testDbHandler from "../src/routes/test-db.js";

const app = express();

app.use(cors());
app.use(express.json());

/*
  IMPORTANT:
  Vercel already serves everything under /api
  so DO NOT add /api again here
*/

// Mount routes
app.use("/auth", authRoutes);
app.use("/products", productsRoutes);
app.use("/orders", ordersRoutes);
app.use("/orders-history", ordersHistoryRoutes);
app.use("/bank-accounts", bankAccountsRoutes);
app.use("/test-db", testDbHandler);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "DistroHub Backend API is running on Vercel",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || "production"
  });
});

export default app;