import express from "express";
import { login,logout,signup,getMe } from "../controllers/auth.controller.js";
import { protectedRoute } from "../middlewares/protectedRoute.js";

const router = express.Router();

router.get("/me",protectedRoute,getMe);
router.post("/signup",signup);
router.post("/login",login);
router.post("/logout",logout);

export default router;