
import mongoose, {Schema} from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
const userSchema= new Schema(
    {
        username:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
            index:true
        },
        fullname:{
            type:String,
            required:true,
            trim:true,
            index:true
        },
        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },
        avatar:{
            type:String, // cloudinary
            required:true
        },
        coverImage:{
            type:String,
        },
        password:{
            type:String,
            required:[true,"password is required"],
           minlength: [8,"Password must be minimum 8 character"]
        },
        watchHistory:{
            type:[
                {
                    type:Schema.Types.ObjectId,
                    ref:"Video"
                }
            ]
        },
        refreshToken:{
            type:String
        }
    },

    {
        timestamps:true
    }
)
userSchema.pre("save", async function(next){
        if(!this.isModified("password")) return next()
            this.password= await bcrypt.hash(this.password,10)
        next()
})
userSchema.methods.isPasswordCorrect = async function(password){
    return bcrypt.compare(password,this.password)
}
userSchema.methods.generateUserToken= function(){
    return  jwt.sign({
        _id: this._id,
        username:this.username,
        fullname:this.fullname,
        email:this.email
    },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn:process.env.ACCESS_TOKEN_EXPIRY
  }
)
}
userSchema.methods.generateRefreshToken= function(){
    return  jwt.sign({
        _id: this._id,
 
    },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn:process.env.REFRESH_TOKEN_EXPIRY
  }
)
}
export const User= mongoose.model("User", userSchema)  // in mongodb it save as users