import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    // get the content from req and save to db 
    const {content}= req.body
    const user = req.user
    if(!content)
    {
        throw new ApiError(400,"Content must not be empty.")
    }
    const tweet=  await Tweet.create({
        content,owner:user
    })
    const postedtweet= await Tweet.findById(tweet._id).populate({
        path: 'owner',
        select: '-password -refreshToken' 
      });
    if(!postedtweet){
        throw new ApiError(500," Error while posting tweet")
    }
    return res.status(200).json(new ApiResponse(200,postedtweet,"tweet posted successfully."))
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId}= req.params
    if(!userId){
        throw new ApiError(400,"User id must be provided.")
    }
    if(userId!==req?.user?._id.toString()){
        throw new ApiError(401,"Invalid user id ")
    }
    
    const userTweets = await Tweet.find({ owner: userId }).populate({
        path: 'owner',
        select: '-password -refreshToken'
    });
    if (!userTweets.length) {
        throw new ApiError(404, "No tweets found for this user.");
    }
    return res.status(200).json(new ApiResponse(200, userTweets, "User tweets fetched successfully."));
})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const {content}=req.body
    const {tweetId}= req.params
    if(!tweetId || !tweetId.trim()){
        throw new ApiError(400,"Tweet ID is required.")
    }
    if(!content || !content.trim() )
    {  throw new ApiError(400,"Content can not be empty") }
    const oldtweet= await Tweet.findById(tweetId)
    if(!oldtweet){
        throw new ApiError(404,"Tweet not found")
    }
    if(oldtweet?.owner.toString() !==req?.user?._id.toString()){
        throw new ApiError(400,"Only Owner can delete the tweet. ")
    }
    
    oldtweet.content= content
    await oldtweet.save()
    const updatedTweet= await Tweet.findById(tweetId).populate({
        path:"owner",
        select:"-password -refreshToken"
    })
    return  res.status(200).json(new ApiResponse(200,updatedTweet,"tweet updated successfully."))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const {tweetId}= req.params
    if(!tweetId || !tweetId.trim()){
        throw new ApiError(400,"Tweet ID is required.")
    }
    const tweet= await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"Tweet not found")
    }
    if(tweet?.owner.toString() !==req?.user?._id.toString()){
        throw new ApiError(400,"Only Owner can delete the tweet. ")
    }
    
    const deletedTweet= await Tweet.findByIdAndDelete(tweetId)
    return  res.status(200).json(new ApiResponse(200,deletedTweet,"tweet deleted successfully."))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
