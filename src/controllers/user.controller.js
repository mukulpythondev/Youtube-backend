import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary, { deleteOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const generateAcesstokenAndRefreshtoken= async(userid)=>{
              try {
                const user = await User.findById(userid)
                const accessToken= user.generateUserToken()
                const refreshToken= user.generateRefreshToken()
                user.refreshToken= refreshToken
                user.save({validationBeforeSave:false}) 
                return { accessToken,refreshToken}
              } catch (error) {
                throw new ApiError(500, "Server Error: Something went wrong while creating the access token and refresh token.")
              }
}
 export  const registerUser= asyncHandler( async (req,res)=>{
             // get the data from frontend 
             // validate the data like any field is empty or wrong format
             // check if the user exist 
             // check for images or avatar 
             // upload them to cloudinary, avatar 
             // create user object  in the mongodb 
             // remove password and refresh token field from response 
             // check for user creation 
             // give resonse to frontend about the success or failure 
             const  {email, username, fullname,password } = req.body
             if( [email, username, fullname,password].some((field)=> field?.trim()==="" ) ){
                         throw new ApiError(400, "All Field are Required!")
             }
             const existedUser= await User.findOne({
               $or:[{ username }, { email }]
             })
             if(existedUser){
               throw new ApiError(409, "Email or username is already exist!")
             }
             const avatarlocalpath= req?.files?.avatar?.[0]?.path;
            // console.log(req)
             const coverImagelocalpath= req.files?.coverImage?.[0]?.path;
             if(!avatarlocalpath){
               throw new ApiError(400, "Avatar file is required!")
             }
             const avatar= await uploadOnCloudinary(avatarlocalpath)
             const coverImage=  coverImagelocalpath ? await uploadOnCloudinary(coverImagelocalpath) : null;
             if(!avatar){
               throw new ApiError(400, "Avatar file is required!")
             }

             const user= await User.create({
              fullname, email, password, avatar: avatar.url, coverImage: coverImage ? coverImage?.url : "", username:username.toLowerCase()
             })
          
             const createdUser= await User.findById(user._id).select(" -password -refreshToken ")
             if(!createdUser)
              {
                throw new ApiError(500, "Something Went Wrong while creating the User!")
              }
              res.status(201).json(
               new  ApiResponse(200, createdUser,"User registered Successfully" )
              )
})
export const loginUser= asyncHandler(async (req,res)=>{
    // res email password
  // validate email or password
  // check user exist or not
  // match with email or username
  // generate refresh token 
  const {password,email,username}= req.body
  if(!(username || email)){ // username && email
    throw new ApiError(400,"Email or username is required.")
  }
  const user = await User.findOne({
    $or:[{username},{email}]
  })
  if(!user){
    throw new ApiError(404,"User does not exist!")
  }
  const isPasswordVaild= await user.isPasswordCorrect(password)
  if(!isPasswordVaild){
    throw new ApiError(401,"Invalid user credentials!")
  } 
   const {refreshToken,accessToken}= await generateAcesstokenAndRefreshtoken(user._id)
   const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   const options= {
    httpOnly:true,
    secure:true
   }
  return  res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken  ", refreshToken, options).json(
    new ApiResponse(
      200, 
      {
        user: loggedInUser, accessToken,refreshToken
      },
      "User loggedin Successfully."
    )
  )
})
export const logoutUser= asyncHandler(async(req,res)=>{
            await User.findByIdAndUpdate(req.user._id, {
              $unset:{
                refreshToken:1  // better than undefined
              }
            },
          {
            new:true
          } )
          const options= {
            httpOnly:true,
            secure:true
           }
           return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).
           json( new ApiResponse(200, {}, "User Logged Out.") )
})
export const changeCurrentPassword= asyncHandler(async (req,res)=>{
           const {oldPassword, newPassword}= req.body
           const user= await User.findById(req?.user._id)
            const  isPasswordVaild = await user.isPasswordCorrect(oldPassword)
            if(!isPasswordVaild){
              throw new ApiError(400, "Incorrect Old Password")
            }
            user.password= newPassword
            await user.save({validationBeforeSave:false})
            return res.status(200).json(
              new ApiResponse(200, {}, 'Password Changed Successfully!')
            )
})
export const currentUser= asyncHandler(async(req,res)=>{
  return res.status(200).json(
    new ApiResponse(200, req.user, "Current user fetched successfully!")
  )
})
export const updateAccountDetails= asyncHandler(async(req,res)=>{
  const {fullname,email}= req.body
   if(!(fullname?.trim() || email?.trim()) ){
    throw new ApiError(400, "Field not be empty")
   }
  const user = await User.findByIdAndUpdate(req.user?._id,{
    $set:{
      fullname:fullname,
      email  // both are correct
    }
  },{new:true}).select("-password") // after new you will get the updated info
   return res.status(200).json(
    new ApiResponse(200,user, "User Details Updated Successfully!")
   )

})
export const updateAvatar= asyncHandler(async(req,res)=>{
  const oldavatar= req?.user.avatar
  const avatarPath= req?.file?.path
  if(!avatarPath)
    throw new ApiError(400,"Avatar File is missing!")
 const avatar= await uploadOnCloudinary(avatarPath)
 if(!avatar.url)
  throw new ApiError(400,"Error while uploading on Cloudinary.")
  const user= await User.findByIdAndUpdate(req?.user?._id,{
    $set:{
      avatar:avatar.url
    }
   },{
    new:true
   }).select("-password")
   deleteOnCloudinary(oldavatar)

   return res.status(200).json(
    new ApiResponse(200,user, "Avatar updated successfully!")
   )
})
export const updateCoverImage= asyncHandler(async(req,res)=>{
  const oldCoverImage= req?.user.coverImage
  const CoverImagePath= req?.file?.path
  if(!CoverImagePath)
    throw new ApiError(400,"Cover Image  File is missing!")
 const CoverImage= await uploadOnCloudinary(CoverImagePath)
 if(!CoverImage.url)
  throw new ApiError(400,"Error while uploading on Cloudinary.")
  const user= await User.findByIdAndUpdate(req?.user?._id,{
    $set:{
      CoverImage:CoverImage.url
    }
   },{
    new:true
   }).select("-password")
   deleteOnCloudinary(oldCoverImage)
   return res.status(200).json(
    new ApiResponse(200,user, "Cover Image updated successfully!")
   )
})
export const getUserChannelinfo= asyncHandler(async(req,res)=>{
      const { username} = req.params
      if(!username?.trim()){
        throw new ApiError(400, "Username is required!")
      }
      const channel= await User.aggregate([
        {
         $match:{
          username: username?.toLowerCase()
      }
        },
        {
          $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
          }
        },
        {
          $lookup:{
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
          }
        },
        {
          $addFields:{
            subscribersCount:{
              $size:"$subscribers"
            },
            channelSubscribedTo:{
              $size:"$subscribedTo"
            },
            isSubscribed:{
              $cond:{
                if:{ $in:[req?.user._id, "$subscribers.subscriber" ]  },
                then:true,
                else:false
              }
            }
          }
        },
        {
          $project:{
            fullname:1,
             username:1,
             subscribersCount:1, 
             channelSubscribedTo:1,
             avatar:1, 
             isSubscribed:1,
             coverImage:1
          }
        }
      ])
        if(!channel?.length)
        {
          throw new ApiError(404,"Channel does not exist!")
        }
       return res.status(200).json(
          new ApiResponse(200, channel[0], "Channel details fetched successfully!")
        )

})
export const getWatchedHistory= asyncHandler(async(req,res)=>{
  const {_id}= req?.user
  const user = await User.aggregate([
    {
      $match:{
        _id: _id  // new mongoose.Types.ObjectId(req?.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                   $project:{
                    username:1,fullname:1,avatar:1
                   }
                }
              ]
            }
          }
        ]
      }
    }
  ])
  return res.status(200).json( new ApiResponse(200, user[0].watchHistory,"Watch History fetched successfully."))
})
export const refreshAccessToken= asyncHandler(async(req,res)=>{
  const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken)
  {
    throw new ApiError(401, "Unauthorized Request")
  }
 try {
   const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
   const user  = await User.findById(decodedToken?._id)
   if(!user) 
   {
     throw new ApiError(401, "Invalid Refresh Token")
   }
   if(user?.refreshToken !== incomingRefreshToken)
   { 
     throw new ApiError(401, "Refresh token is expired or used")
   }
   const options= {
     httpOnly:true,
     secure:true
    }
    const  {accessToken,newRefreshToken} = await generateAcesstokenAndRefreshtoken(user._id)
    return res.status(200).cookie( "accessToken",accessToken,options).cookie("refreshToken",newRefreshToken,options).json(
     new ApiResponse(200, {accessToken, refreshToken:newRefreshToken}, "Access token refreshed successfully")
    )
 } catch (error) {
  throw new ApiError(401, error?.meessage || "Invalid Refresh Token")
 }
})