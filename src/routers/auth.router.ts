import { Router } from "express";
import spotifyRouter from "@/routers/spotify.router.js";
import authController from "@/controllers/auth.controller.js";
import { requireAuth } from "@/middleware/auth.middleware.js";

const router = Router();

router.use("/spotify", spotifyRouter);
router.get("/me", requireAuth, authController.me);

export default router;
