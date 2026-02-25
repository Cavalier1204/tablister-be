import { Router } from "express";
import spotifyController from "@/controllers/spotify.controller.js";
import { spotifyAuth, requireAuth } from "@/middleware/auth.middleware.js";

const router = Router();

router.get("/login", spotifyController.login);
router.get("/callback", spotifyController.callback);
router.get("/profile", requireAuth, spotifyAuth, spotifyController.getProfile);
router.get(
  "/playlists",
  requireAuth,
  spotifyAuth,
  spotifyController.getPlaylists,
);
router.post("/logout", spotifyController.logout);

export default router;
