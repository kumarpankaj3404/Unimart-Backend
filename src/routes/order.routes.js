import {Router} from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import checkRole from '../middleware/checkRole.middleware.js';
import{
    createNewOrder,
    changeStatus,
    showAllOrders,
    showOrderByUser
} from "../controllers/order.controllers.js";

const router = Router();

//SECURE ROUTES - require authentication
router.route('/create').post(verifyJWT, createNewOrder);
router.route('/user-orders').get(verifyJWT, showOrderByUser);

//ADMIN ROUTES
router.route('/all-orders').get(verifyJWT, checkRole(['admin']), showAllOrders);
router.route('/change-status').patch(verifyJWT, checkRole(['admin']), changeStatus);

export default router;