import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from "../models/video.model.js"

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
     //TODO: create playlist
    if(!name || !description)
    {
        throw new ApiError(400,"All fields are required")
    }
    const playlist= await Playlist.create({
        name, description, owner:req?.user?._id
    })
    if(!playlist){
        throw new ApiError(500,"Playlist can not be created.")
    }
    return res.status(200).json(new ApiResponse(200,playlist,"Playlist created successfully."))
   
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!userId){
        throw new ApiError(400,"User Id is required")
    }
    const findPlaylist= await Playlist.find({owner:userId})
    if(!findPlaylist){
        throw new ApiError(500,"Playlist can not be created.")
    }
    return res.status(200).json(new ApiResponse(200,findPlaylist,"Playlist fetched successfully."))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!playlistId){
        throw new ApiError(400,"Playlist Id is required")
    }
    const findPlaylist= await Playlist.findById(playlistId)
    if(!findPlaylist){
        throw new ApiError(404,"Playlist not found")
    }
    return res.status(200).json(new ApiResponse(200,findPlaylist,"Playlist fetched successfully."))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: Add video to the playlist
    if(!playlistId || !videoId)
        {
            throw new ApiError(400,"All fields are required")
        }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    const video= await Video.findById(videoId)    
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(playlist.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can update the video")
    if (!playlist.videos.includes(video._id)) {
        playlist.videos.push(video._id);
        await playlist.save();
    } else {
        throw new ApiError(400, "Video is already in the playlist.");
    }
   const modifiedPlaylist= await Playlist.findById(playlistId).populate({
    path: "videos",
    select: "title description thumbnail",
    populate: { path: "owner", select: "name email" } // Adjust according to your schema
});
   return res.status(200).json(new ApiResponse(200, modifiedPlaylist, "Video added to playlist successfully."));
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    if(!playlistId || !videoId)
        {
            throw new ApiError(400,"All fields are required")
        }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found")
    }
    const video= await Video.findById(videoId)    
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(playlist.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can update the video")
    const videoIndex= playlist.videos.indexOf(video._id)
    if (videoIndex!==-1) {
           playlist.videos.splice(videoIndex,1)
        await playlist.save();
        return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist successfully."));
    } else {
        throw new ApiError(400, "Video is not found in the playlist.");
    }
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
    if(!playlistId){
        throw new ApiError(400,"Playlist id is required.")
    }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found.")
    }
    if(playlist.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can update the video")
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    if(!deletedPlaylist){
        throw new ApiError(500,"Playlist can not be deleted")
    }
  
    return res.status(200).json(new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully."));
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!playlistId){
        throw new ApiError(400,"Playlist id is required.")
    }
    if(!name && !description)
        {
            throw new ApiError(400,"Minimum 1 field is required")
        }
    const playlist= await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"Playlist not found.")
    }
    if(playlist.owner.toString()!== req?.user._id?.toString())
        throw new ApiError(400, "Only Owner can update the video")
    if(name) playlist.name= name
    if(description) playlist.description= description
     await  playlist.save()
     const updatedPlaylist= await Playlist.findById(playlistId)
     return res.status(200).json(new ApiResponse(200,updatedPlaylist,"Playlist details updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}
