import express from "express";
import cors from "cors"

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", message: "Server running healthy!" });
});

export { app };