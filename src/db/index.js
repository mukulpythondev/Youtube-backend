import mongoose from "mongoose"
import { DB_NAME } from "../constants.js"

const connectDB= async ()=>{
    try {
        const connectionInstannce = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`Mongodb is hosted on ${connectionInstannce.connection.host}`)
    } catch (error) {
        console.log("Error:",error)
        process.exit((1))
    }
}
export default connectDB