import {Router} from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import{
    registerUser,
    loginUser,
    logoutUser,
    sendOtp,
    verifyOtp,
    addFavItem,
    updateUserProfile,
    removeFromFavorites
} from '../controllers/user.controllers.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

//SECURE ROUTES - require authentication
router.route('/logout').get(verifyJWT, logoutUser);
router.route('/send-otp').get(verifyJWT, sendOtp);
router.route('/verify-otp').post(verifyJWT, verifyOtp);
router.route('/add-favItems').post(verifyJWT, addFavItem);
router.route("/update-profile").patch(verifyJWT, updateUserProfile);
router.route("/remove-fav").put(verifyJWT, removeFromFavorites);

export default router;
