import { Router } from "express";
import { changeCurrentPassword, currentUser,
     getUserChannelinfo, getWatchedHistory, 
     loginUser, logoutUser, refreshAccessToken, registerUser,
      updateAccountDetails, updateAvatar, 
      updateCoverImage } from "../controllers/user.controller.js";
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from "../middlewares/auth_middleware.js";
const router= Router()
const uploadFields = upload.fields([{ name: 'avatar', maxCount: 1 }, { name: 'coverImage', maxCount: 1 }]);

// router.post('/register', uploadFields, registerUser);
router.route('/register').post(uploadFields,registerUser)
router.route('/login').post(loginUser )
// secured user
router.post('/logout', verifyJWT,logoutUser)
router.post('/refresh-token', refreshAccessToken)
router.route('/change-password').post(verifyJWT,changeCurrentPassword)
router.route('/current-user').get(verifyJWT,currentUser)
router.route('/update-account').patch(verifyJWT,updateAccountDetails)
router.route('/avatar').patch(verifyJWT,upload.single("avatar"),updateAvatar)
router.route('/cover-image').patch(verifyJWT,upload.single("coverImage"),updateCoverImage)
router.route('/channel/:username').get(verifyJWT,getUserChannelinfo)
router.route('/history').get(verifyJWT,getWatchedHistory)
export default router