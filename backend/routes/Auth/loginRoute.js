import express from "express";
import { userDB } from "../../models/userModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const router=express.Router();

router.post('/',async(req,res)=>
{
    const{email,password}=req.body;
    if(!email||!password)
    {
        return res.status(400).json({message:"Invalid credentials"})
    }
    try {
        const userExist=await userDB.findOne({email});
        if(!userExist)
        {
            return res.status(404).json({message:"Email not found"})
        }
        
        const comparePassword=await bcrypt.compare(password,userExist.password);
        if(!comparePassword)
        {
            return res.status(400).json({message:"Invalid password or email"});
        }
        const token=jwt.sign(
            {userId:userExist._id,email:userExist.email,name:userExist.username},
            process.env.JWT_SECRET,
            {expiresIn:"7d"}
        )
        console.log("Token: ",token);
        return res.status(200).json({message:"User logged in successfully",token})
    } catch (error) {
     console.error("Error: ",error);
     return res.status(500).json({message:"Internal server error"});   
    }
})

export default router;