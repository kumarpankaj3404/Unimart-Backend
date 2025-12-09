import { Order } from "../models/order.models.js";
import asyncHandler from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {ApiResponse} from '../utils/ApiResponse.js';

const createNewOrder = asyncHandler(async (req,res)=>{

    const { products, totalAmount, payment} = req.body;
    if(!products || !totalAmount || !payment){
        throw new ApiError(400,"Provide all the required fields to add a new Order")
    }

    const user = req.user._id ;
    
    const newOrder = await Order.create({
        products,
        orderBy: user,
        totalAmount,
        payment
    })

    if(!newOrder){
        throw new ApiError(500,"Something went wrong while creating order");
    }

    return res
    .status(201)
    .json(
        new ApiResponse(201, newOrder, "Order created successfully")
    )

})

const changeStatus = asyncHandler(async (req,res) =>{
    const{ orderId, newStatus} = req.body
    if(!orderId || !newStatus){
        throw new ApiError(400,"OrderID or newStatus is required");
    }

    const updateOrder = await Order.findByIdAndUpdate(
        orderId,
        {
            status: newStatus
        },
        { new: true}
    )

    if(!updateOrder){
        throw new ApiError(400,"Can't find order by Id provided")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,updateOrder,"Order status successfully updated")
    )
})

const showAllOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find().sort({ createdAt: -1 }).populate("orderBy","name email number");

    if(!orders){
        throw new ApiError(500,"Something went wrong while fetching orders");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, orders, "Orders fetched successfully")
    )
})

const showOrderByUser = asyncHandler(async (req,res)=>{
    const userId = req.user._id;

    const userOrders = await Order.find({orderBy: userId}).sort({ createdAt: -1});

    if(!userOrders){
        throw new ApiError(500,"Something went wrong while fetching orders");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, userOrders, "User Orders fetched successfully")
    )
})

export{
    createNewOrder,
    changeStatus,
    showAllOrders,
    showOrderByUser
}