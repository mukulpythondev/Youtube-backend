import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

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
              $set:{
                refreshToken:undefined
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