import jwt, { decode } from "jsonwebtoken";

export const verifyToken=async(req,res,next)=>{
const token=req.headers.authorization?.split(" ")[1];
if(!token)
{
    return res.status(403).json({message:"No token, Authorization denied"})
}
try {
    const decoded=jwt.verify(token,process.env.JWT_SECRET);
    console.log("Decoded Token: ",decoded);
    req.user=decoded;
    next();
} catch (error) {
 console.error("Error: ",error);
 res.status(401).json({message:"Invalid token"});   
}
}