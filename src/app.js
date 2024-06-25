import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app= express()
app.use(cors({
    origin:process.env.CORS_ORIGIN
}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({limit:"16kb", extended:true}))
app.use(express.static("public"))
app.use(cookieParser())
// Routes Import
import userRouter from "./routes/user.route.js"
app.use("/api/v1/users", userRouter)

export default app