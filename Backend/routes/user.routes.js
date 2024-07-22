import express from "express";
import { protectedRoute } from "../middlewares/protectedRoute.js";
import { followUnfollowUser, getUserProfile,getSuggestedUsers, updateUser } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/profile/:username",protectedRoute,getUserProfile);
router.get("/suggested",protectedRoute,getSuggestedUsers);
router.get("/follow/:id",protectedRoute,followUnfollowUser);
router.get("/update",protectedRoute,updateUser);


export default router;