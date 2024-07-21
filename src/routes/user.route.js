import { Router } from "express";
import { changeCurrentPassword, currentUser, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
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
router.route('/get-user').get(verifyJWT,currentUser)
export default router