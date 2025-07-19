/* eslint-disable @typescript-eslint/no-unused-vars */
import AppError from "../../errorHelpers/AppError";
import { IAuthProvider, IUser, Role } from "./user.interface";
import { User } from "./user.model";
import httpstatus from "http-status-codes"
import bcryptjs from "bcryptjs"
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import { catchAsync } from "../../utils/catchAsync";
import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../../utils/jwt";
import { sendResponse } from "../../utils/sendResponse";

const createUser = async(payload: Partial<IUser>)=>{
const {email,password, ...rest}= payload;

const isUserExist = await User.findOne({email})

if(isUserExist){
    throw new AppError(httpstatus.BAD_REQUEST, "User Already Exist")
}

const hashedPassword = await bcryptjs.hash(password as string, Number(envVars.BCRYPT_SALT_ROUND))

const authProvider: IAuthProvider={provider:"credentials", providerId: email as string}

const user = await User.create({
    email,
    password: hashedPassword,
    auths:[authProvider],
    ...rest
})
return user
}

const updateUser = async(userId:string, payload:Partial<IUser>, docodedToken: JwtPayload)=>{
    const ifUserExist = await User.findById(userId);

    if(!ifUserExist){
        throw new AppError(httpstatus.NOT_FOUND,"User Not Found")
    }

    if(payload.role){
        if(docodedToken.role === Role.USER || docodedToken.role === Role.GUIDE){
            throw new AppError(httpstatus.FORBIDDEN,"You Are Not authorized")
        }

        if(payload.role === Role.SUPER_ADMIN && docodedToken.role=== Role.ADMIN){
            throw new AppError(httpstatus.FORBIDDEN,"You Are Not authorized")
        }
    }

    if(payload.isActive || payload.isDeleted || payload.isVerified){
        if(docodedToken.role === Role.USER || docodedToken.role === Role.GUIDE){
            throw new AppError(httpstatus.FORBIDDEN,"You Are Not authorized")
        }
    }

    if(payload.password){
        payload.password = await bcryptjs.hash(payload.password, Number(envVars.BCRYPT_SALT_ROUND))
    }

    const newUpdateUser = await User.findByIdAndUpdate(userId, payload, {new:true, runValidators:true})

    return newUpdateUser
}



const getAllUsers = async()=>{
    const users = await User.find({})
    const totalUsers = await User.countDocuments({})
    return {
        data: users,
        meta:{
            total: totalUsers
        }
    }
}

export const UserServices = {
    createUser,
    getAllUsers,
    updateUser,
}