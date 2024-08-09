import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!videoId){
        throw new ApiError(400,"VideoId is required")
    }
    const pageNumber= parseInt(page,10)
    const limitNumber= parseInt(limit,10)
    const allComments= await Comment.find({video:videoId}).skip((pageNumber-1) * limitNumber).
    limit(limitNumber).populate([
        {path:"video", select:"title description "},
        {path:"owner", select:"username email  "},
    ])
    if(!allComments || allComments.length===0){
        throw new ApiError(404,"Comments not found on this video")
    }
    const totalComments= await Comment.countDocuments({video:videoId})
    return res.status(200).json(new ApiResponse(200, {data:allComments,totalComments,totalPages:Math.ceil(totalComments/limitNumber),currentPage:pageNumber },"All comment fetched successfully."))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId}= req.params
    const {content}= req.body
    if(!videoId){
        throw new ApiError(400,"VideoId is required")
    }
    const video= await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not exist.")
    }
    const comment = await Comment.create({
        content:content, video:video?._id, owner:req?.user?._id
    })
    if(!comment){
        throw new ApiError(500, "Comment can not  added.")
    }
    const getComment= await Comment.findById(comment._id).populate([
        {path:"video", select:"title description "},
        {path:"owner", select:"username email  "},
    ])
    return res.status(200).json(new ApiResponse(200, getComment,"Comment added successfully."))


})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId}= req.params
    const {content}= req.body
    if(!commentId){
        throw new ApiError(400,"Comment id is required.")
    }
    const findComment= await Comment.findById(commentId)
    if(!findComment){
        throw new ApiError(404,"Comment not found.")
    }
    if(findComment.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can update the video")
    const updateComment= await Comment.findByIdAndUpdate(commentId ,{
       $set:{ content}
    }, {
        new:true
    })
    return res.status(200).json(new ApiResponse(200,updateComment,"Comment updated successfully."))
    
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId}= req.params
    if(!commentId){
        throw new ApiError(400,"Comment id is required.")
    }
    const findComment= await Comment.findById(commentId)
    if(!findComment){
        throw new ApiError(404,"Comment not found.")
    }
    if(findComment.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can update the video")
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(!deletedComment){
        throw new ApiError(500,"Comment Can not be deleted")
    }
  
    return res.status(200).json(new ApiResponse(200, deletedComment, "Comment deleted successfully."));
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
