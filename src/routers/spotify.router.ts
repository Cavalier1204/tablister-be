import { Router } from "express";
import spotifyController from "@/controllers/spotify.controller.js";

const router = Router();

router.get("/login", spotifyController.login);
router.get("/callback", spotifyController.callback);

export default router;
