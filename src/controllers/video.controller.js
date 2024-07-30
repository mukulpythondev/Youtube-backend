import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import uploadOnCloudinary, { deleteOnCloudinary } from "../utils/cloudinary.js"
import { populate } from "dotenv"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy='createdAt', sortType='desc', userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    if(!userId){
        throw new ApiError(400,"UserId is required.")
    }
    let conditions= {owner:userId}
    const pageNumber= parseInt(page,10)
    const limitNumber= parseInt(limit,10)
    const sortDirection = sortType=== "asc" ? 1: -1 ;
    if(query){
        conditions={ ...conditions,  
            $or:[ {
                title:{ $regex:query, $options:'i' },
                description:{ $regex:query, $options:'i' }
            } ]
        }
    }

const videos= await Video.find(conditions)
.sort({[sortBy]:sortDirection}).
skip((pageNumber-1) * limitNumber).
limit(limitNumber).populate({
    path:"owner",
    select:"-password -refreshToken"
})
const totalVideos= await Video.countDocuments(conditions)
if(videos.length===0)
   return res.status(200).json(new ApiResponse(200, null, "Videos not found!"));
    return res.status(200).json(new ApiResponse(200, {data:videos, totalVideos,totalPages:Math.ceil(totalVideos/limitNumber),currentPage:pageNumber } , "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title|| !description){
        throw new ApiError(400,"All Fields are required")
    }
    const videoLocalpath= req?.files?.videoFile?.[0]?.path
    if(!videoLocalpath){
        throw new ApiError(400,"Video file is required")
    }
    const thumbnaillocalpath= req?.files?.thumbnail?.[0]?.path
    if(!thumbnaillocalpath){
        throw new ApiError(400,"Thumbnail file is required")
    }
    const video= await uploadOnCloudinary(videoLocalpath)
    console.log("video",video)
    const thumbnail= await uploadOnCloudinary(thumbnaillocalpath)
    if(!video || !thumbnail){
        throw new ApiError(500, "Fail to upload video or thumbnail on cloudinary")
    }
    const createdVideo= await Video.create({
        title,description,videoFile:video.url,thumbnail:thumbnail.url, owner:req?.user?._id, duration:video.duration
    })
    const uploadedvideo= await Video.findById(createdVideo._id).populate({
        path:"owner",
        select:"-refreshToken -password"
    })
    if(!uploadedvideo){
        throw new ApiError(500, "Fail to upload video or thumbnail on database")
    }
    return res.status(200).json( new ApiResponse(200,uploadedvideo,"Video uploaded successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(400,"Video Id is required.")
    }
    if(!isValidObjectId(videoId))
        throw new ApiError(400,"Invalid Video Id.")
    const video= await Video.findById(videoId).populate({
        path:"owner",
        select:"-password -refreshToken"
    })
    if(!video){
        throw new ApiError(404, "Video does not exist.")
    }
    return res.status(200).json(new ApiResponse(200,video,"Video fetched successfully."))

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description}=req.body
    const newThumnailLocalpath= req?.file?.path
    if(!videoId){
        throw new ApiError(400,"Video Id is required.")
    }
    if(!isValidObjectId(videoId))
        throw new ApiError(400,"Invalid Video Id.")
    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404, "Video does not exist.")
    }
    if(video.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can updatet the video")
    const oldthumbnail= video.thumbnail
    if(title)
        video.title= title
    if(description)
        video.description= description
    
    if(newThumnailLocalpath){
        try {
            const thumbnailUrl = await uploadOnCloudinary(newThumnailLocalpath);
            if (!thumbnailUrl) {
                throw new ApiError(500, "Error while uploading thumbnail to Cloudinary.");
            }
            video.thumbnail = thumbnailUrl.url;
          if(oldthumbnail){
            deleteOnCloudinary(oldthumbnail)
          }
        } catch (error) {
            throw new ApiError(500, "Error while uploading thumbnail.");
        }
    }
 
    await video.save();

    const updatedVideo = await Video.findById(videoId).populate({
        path: "owner",
        select: "-password -refreshToken"
    });
    return res.status(200).json(new ApiResponse(200, updatedVideo, "Video updated successfully."));


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!videoId){
        throw new ApiError(400,"Video Id is required.")
    }
    if(!isValidObjectId(videoId))
        throw new ApiError(400,"Invalid Video Id.")
    const video= await Video.findById(videoId)
    if(video.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can updatet the video")
    const deletedVideo = await Video.findByIdAndDelete(videoId)
    if(!deletedVideo){
        throw new ApiError(404,"Video not found.")
    }
  
    return res.status(200).json(new ApiResponse(200, deletedVideo, "Video deleted successfully."));

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(400,"Video Id is required.")
    }
    if(!isValidObjectId(videoId))
        throw new ApiError(400,"Invalid Video Id.")
    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video is not found.")
    }
    if(video.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can updatet the video")
    const publishVideoStatus= await Video.findByIdAndUpdate(videoId,{
        isPublished: !video.isPublished
    },{
        new:true
    })
    return res.status(200).json(new ApiResponse(200, publishVideoStatus, "Video publish status updated successfully."));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}
