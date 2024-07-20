// import multer from "multer";
// import { fileURLToPath } from 'url';
// import path from "path";
// import fs from "fs";

// // Get the current file's directory
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Ensure the directory exists
// const tempDir = path.join(__dirname, "../public/temp");

// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir, { recursive: true });
// }

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, tempDir); // Save to public/temp folder
//   },
//   filename: function (req, file, cb) {
//     cb(null, file.originalname); // Save with original filename
//   }
// });

// const upload = multer({ storage });

import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now()
      cb(null, file.originalname)
    }
  })
  
 const upload = multer({ storage})
  export { upload };