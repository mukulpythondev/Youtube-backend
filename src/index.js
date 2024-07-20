// require('dotenv').config9()
// import mongoose from 'mongoose'
import app from './app.js'
import connectDB from './db/index.js'
import dotenv from "dotenv"
// import { DB_NAME } from './constants.js'
// import express from "express"
dotenv.config({
    path:"./.env"
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`App is listining on the ${process.env.PORT}`)
    })
})
.catch((error)=>{
    console.log("Error - ",error)
})




// const app= express
// (async ()=>{
 
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
//         app.on("error", (error)=>{
//             console.log("ERRR:",error)
//             throw error
//         })
//         app.listen(process.env.PORT, ()=>{
//             console.log(`app is running on the ${process.env.PORT}`)
//         })
//     } catch (error) {
//         console.error("Error", error)
//         throw error
//     }
// })()