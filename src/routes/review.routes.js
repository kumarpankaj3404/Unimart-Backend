import { Router } from "express";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { addReview } from "../controllers/review.controllers.js";

const router = Router();

router.use(verifyJWT);

router.route("/add").post(addReview);

export default router;
