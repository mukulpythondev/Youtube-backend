import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if(!channelId)
        throw new ApiError(400,"Channel id is requrired ") 
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
      }
    // TODO: toggle subscription
    if(channelId.toString() === req?.user?._id.toString()){
      throw new ApiError(401, "User can not subscribe his channel.");
    }
      const subscription = await Subscription.findOne({
        channel: channelId,
        subscriber: req.user?._id,
      });
      if (subscription) {
        await Subscription.findByIdAndDelete(subscription._id);
        return res.status(200).json(
          new ApiResponse(200, {
            subscription: null 
          },"Unsubscribed successfully"),
        );
      } else {
        const newSubscription = await Subscription.create({
          subscriber: req.user?._id,
          channel: channelId,
        });
        return res
          .status(200)
          .json(new ApiResponse(200,   newSubscription ,"Subscribed succesfully"));
      }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {subscriberId} = req.params
    if(!subscriberId)
      throw new ApiError(400,"Channel id is requrired ") 
  if (!isValidObjectId(subscriberId)) {
      throw new ApiError(400, "Invalid Channel ID");
    }
    const subscription = await Subscription.find({
      channel: subscriberId,
    }).populate({
      path:"subscriber",
      select:"username fullname"
    });
    const totalSubscibers= await Subscription.countDocuments(subscription)
    if(subscription.length===0)
      {
        return res.status(200).json(new ApiResponse(200,{totalSubscibers:0},"Channel Subscribers feteched successfully"))
      }
    return res.status(200).json(new ApiResponse(200,{totalSubscibers,subscription},"Channel Subscribers feteched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!channelId)
      throw new ApiError(400,"Subscriber id is requrired ") 
  if (!isValidObjectId(channelId)) {
      throw new ApiError(400, "Invalid channel ID");
    }
    const subscription = await Subscription.find({
      subscriber: channelId,
    }).populate({
      path:"channel",
      select:"username fullname"
    });
    if(!subscription)
    {
      throw new ApiError(400,"Subscriber does not exist.")
    }
    const totalSubscribedChannels= await Subscription.countDocuments(subscription)
    return res.status(200).json(new ApiResponse(200,{totalSubscribedChannels:totalSubscribedChannels-1 ,subscription},"Subscribed Channel feteched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}