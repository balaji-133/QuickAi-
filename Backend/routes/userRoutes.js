import express from "express"
import { auth } from "../middlewares/auth.js";
import { getPublishedCreations, getUserCreations, toggleLikeCreations } from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/get-user-creations',auth,getUserCreations)
userRouter.get('/community',auth,getPublishedCreations)
userRouter.post('/toggle-like-creation',auth,toggleLikeCreations)

export default userRouter;