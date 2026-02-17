import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import checkRole from '../middleware/checkRole.middleware.js';
import {
    createNewOrder,
    changeStatus,
    showAllOrders,
    showOrderByUser,
    getMyDeliveries,
    getAvailableOrders,
    acceptOrder
} from "../controllers/order.controllers.js";

const router = Router();

//SECURE ROUTES 
router.route('/create').post(verifyJWT, createNewOrder);
router.route('/user-orders').get(verifyJWT, showOrderByUser);

// DELIVERY ROUTES
router.route('/available').get(verifyJWT, checkRole(['delivery']), getAvailableOrders);
router.route('/accept/:orderId').patch(verifyJWT, checkRole(['delivery']), acceptOrder);

//ADMIN ROUTES
router.route('/all-orders').get(verifyJWT, checkRole(['admin']), showAllOrders);
router.route('/change-status').patch(verifyJWT, checkRole(['delivery']), changeStatus);
router.route('/my-deliveries').get(verifyJWT, checkRole(['delivery']), getMyDeliveries);

export default router;