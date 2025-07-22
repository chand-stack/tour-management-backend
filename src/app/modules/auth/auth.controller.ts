/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { AuthServices } from "./auth.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status-codes"
import AppError from "../../errorHelpers/AppError";
import { setAuthCookie } from "../../utils/setCookies";
import { JwtPayload } from "jsonwebtoken";
import { createUserToken } from "../../utils/userToken";
import { envVars } from "../../config/env";

const credentialsLogin = catchAsync(async(req:Request,res:Response,next:NextFunction)=>{
const loginInfo = await AuthServices.credentialsLogin(req.body)

// res.cookie("accessToken", loginInfo.accessToken,{
//     httpOnly:true,
//     secure:false
// })

// res.cookie("refreshToken", loginInfo.refreshToken,{
//     httpOnly:true,
//     secure:false
// })

setAuthCookie(res, loginInfo)

sendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"User Logged In Successfully",
    data:loginInfo
})
})

const getNewAccessToken = catchAsync(async (req:Request,res:Response,next:NextFunction)=>{
    const refreshToken = req.cookies.refreshToken
    if(!refreshToken){
        throw new AppError(httpStatus.BAD_REQUEST, "No Refresh token recieved from cookies")
    }

    const tokenInfo = await AuthServices.getNewAccessToken(refreshToken)

    setAuthCookie(res, tokenInfo)

    sendResponse(res,{
        success: true,
        statusCode:httpStatus.OK,
        message:"New Access Token Retrived Successfully",
        data:tokenInfo
    })
})

const logout = catchAsync(async(req:Request,res:Response,next:NextFunction)=>{
    res.clearCookie("accessToken",{
        httpOnly:true,
        secure:false,
        sameSite:"lax"
    })

    res.clearCookie("refreshToken",{
        httpOnly:true,
        secure:false,
        sameSite:"lax"
    })

    sendResponse(res,{
        success:true,
        statusCode:httpStatus.OK,
        message:"User Logged Out Successfully",
        data: null
    })
})

const resetPassword = catchAsync(async(req:Request,res:Response,next:NextFunction)=>{
const newPassword = req.body.newPassword;
const oldPassword = req.body.oldPassword;
const decodedToken = req.user;

await AuthServices.resetPassword(oldPassword,newPassword,decodedToken as JwtPayload)

sendResponse(res,{
    success:true,
    statusCode:httpStatus.OK,
    message:"Password Changed Successfully",
    data:null
})
})

const googleCallbackController = catchAsync(async(req:Request,res:Response,next:NextFunction)=>{
    let redirectTo = req.query.state ? req.query.state as string : ""

    if(redirectTo.startsWith("/")){
        redirectTo = redirectTo.slice(1)
    }

    const user = req.user

    if(!user){
        throw new AppError(httpStatus.NOT_FOUND,"User Not Found")
    }

    const tokenInfo = createUserToken(user)

    setAuthCookie(res,tokenInfo)

    res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`)
})

export const AuthController = {
    credentialsLogin,
    getNewAccessToken,
    logout ,
    resetPassword,
    googleCallbackController
}