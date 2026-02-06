import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";



const __filename=fileURLToPath(import.meta.url);
const __dirname=path.dirname(__filename);

// Storage configuration for local saving

const storage=multer.diskStorage({
    destination:(req,file,cb)=>{
        cb(null, "uploads");
    },
    filename:(req,file,cb)=>{
        const uniqueSuffix=Date.now()+"-"+Math.round(Math.random()*1e9);
        const ext=path.extname(file.originalname);
        cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    }
});

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
