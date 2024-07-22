
import User from "../models/user.model.js";
import bcrypt from "bcryptjs"
import { generateTokenAndSetCookie } from "../lib/utils/generateToken.js";

// Controllers

export const signup = async (req,res) => {
  try{
    const {fullName,username,email,password} = req.body;
    //Regular Expression Matching
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(!emailRegex.test(email)){
      return res.status(400).json({ error : "Invalid email format "});
    }
    // Check if the User Already Exists ...
    const existingUser = await User.findOne({username});
    if(existingUser){
      return res.status(400).json({ error : "Username is Already taken"});
    }
    // Check if the Email Already Exists ...
    const existingEmail = await User.findOne({email});
    if(existingUser){
      return res.status(400).json({ error : "Email is Already taken"});
    }

    // Check Password Length ...
    if(password.length < 6){
      return res.status(400).json({ error : "Password Must be atleast 6 characters"});
    }

    // Hash Password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt);

    // Creating new USER
    const newUser = new User({
      fullName,
      username:username.toLowerCase(),
      email,
      password:hashedPassword
    })

    if(newUser){
      generateTokenAndSetCookie(newUser._id,res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      })
    } else {
      res.status(400).json({ error : "Invalid user data"});
    }
  }
  catch (err){
    console.log("Error in signup controller",err.message);
    res.status(500).json({ error : "Internal Server Error"});
  }
}


export const login = async (req,res) => {
  try{

    const {username , password} = req.body;
    const user = await User.findOne({username});
    const isPasswordCorrect = await bcrypt.compare(password,user?.password || "")

    if(!user || !isPasswordCorrect){
      return res.status(400).json({error : "Invalid username or password"})
    }

    generateTokenAndSetCookie(user._id,res);

    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      followers: user.followers,
      following: user.following, 
      profileImg: user.profileImg,
      coverImg: user.coverImg,
    })

  }
  catch(err){
    console.log("Error in login controller",err.message);
    res.status(500).json({ error : "Internal Server Error"});
  }
}


export const logout = async (req,res) => {
  try{
    res.cookie("jwt",{maxAge : 0});
    res.status(200).json({ message : "Logged out succesfully"});
  }
  catch(err){
    console.log("Error in logout controller",err.message);
    res.status(500).json({ error : "Internal Server Error"});
  }
};

export const getMe = async (req,res) => {
  try{
    const user = await User.findById(req.user._id).select("-password");
    res.status(200).json(user);
  }
  catch(err){
    console.log("Error in getMe controller", err.message);
    return res.status(500).json({error : "Internal Server Error"});
  }
}

