import express from "express";
import { userDB } from "../../models/userModel.js";
import bcrypt from "bcrypt";
const router=express.Router();

router.post('/',async(req,res)=>{
    const {email,password,username}=req.body;
    if(!email||!password||!username)
    {
        return res.status(400).json({message:"Missing fields"});
    }
    try {
        const userExist=await userDB.findOne({email});
        if(userExist)
        {
            return res.status(409).json({message:"Email already exists"})
        }
        const hashedPassword=await bcrypt.hash(password,10);
        const body={email,password:hashedPassword,username}
        const register=await userDB.create(body);
       return res.status(201).json({message:"User registered successfully",user:{
            username:register.username,
            userId:register._id,
            email:register.email
        }})
    } catch (error) {
        console.error("Error: ",error);
        return res.status(500).json({message:"Internal server error"});
    }
})

export default router;