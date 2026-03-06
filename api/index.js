import express from "express";
import cors from "cors";

import testDb from "../src/routes/test-db.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/test-db", testDb);

export default app;