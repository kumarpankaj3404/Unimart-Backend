import {Router} from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import{
    registerUser,
    loginUser,
    logoutUser,
    sendOtp,
    verifyOtp
} from '../controllers/user.controllers.js';

const router = Router();

router.route('/register').post(registerUser);
router.route('/login').post(loginUser);

//SECURE ROUTES - require authentication
router.route('/logout').get(verifyJWT, logoutUser);
router.route('/send-otp').get(verifyJWT, sendOtp);
router.route('/verify-otp').post(verifyJWT, verifyOtp);

export default router;
