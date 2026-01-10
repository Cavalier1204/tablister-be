import { Router } from "express";
import spotifyController from "@/controllers/spotify.controller.js";
import { spotifyAuth } from "@/middleware/spotifyAuth.js";

const router = Router();

router.get("/login", spotifyController.login);
router.get("/callback", spotifyController.callback);
router.get("/profile", spotifyAuth, spotifyController.getProfile);
router.get("/playlists", spotifyAuth, spotifyController.getPlaylists);

export default router;
