import ApiError from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
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
             console.log(email)
             if( [email, username, fullname,password].some((field)=> field?.trim()==="" ) ){
                                         throw new ApiError(400, "All Field are Required!")
             }
             const existedUser= User.findOne({
               $or:[{ username }, { email }]
             })
             if(existedUser){
               throw new ApiError(409, "Email or username is already exist!")
             }
             const avatarlocalpath= req.files?.avatar[0]?.path;
             const coverImagelocalpath= req.files?.coverImage[0]?.path;
             if(!avatarlocalpath){
               throw new ApiError(400, "Avatar file is required!")
             }
             const avatar= await uploadOnCloudinary(avatarlocalpath)
             const coverImage= await uploadOnCloudinary(coverImagelocalpath)
             if(!avatar){
               throw new ApiError(400, "Avatar file is required!")
             }

             const user= await User.create({
              fullname, email, password, avatar: avatar.url, coverImage: coverImage?.url || "", username:username.toLowerCase()
             })
          
             const createdUser= User.findById(user._id).select(" -password -refreshToken ")
             if(!createdUser)
              {
                throw new ApiError(500, "Something Went Wrong while creating the User!")
              }
              res.status(201).json(
               new  ApiResponse(200, createdUser,"User registered Successfully" )
              )
})
