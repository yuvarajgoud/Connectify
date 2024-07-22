import bcrypt from "bcryptjs"
import { v2 as cloudinary } from "cloudinary";

//Models
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";

export const getUserProfile = async (req,res) => {
  const {username} = req.params;
  try{
    const user = await User.findOne({username}).select("-password");
    if(!user){
      return res.status(404).json({message : "User not found"});
    }
    res.status(200).json(user); 
  }
  catch(err){
    console.log("Error in getUserProfile controller",err.message);
    res.status(500).json({ error : "Internal Server Error"});
  }
}

export const followUnfollowUser = async (req,res) => {
  try{
    const { id } = req.params;
    const userToModify = await User.findById(id);
    const currentUser = await User.findById(req.user._id); // req object had user data came from protected Route

    if( id === req.user._id.toString()){
      res.status(400).json({ error : "You can't follow/unfollow yourself "});
    }

    if(!userToModify || !currentUser){
      res.status(404).json({ error : "User Not Found"});
    }

    const isFollowing = currentUser.following.includes(id);

    if(isFollowing){
      // Unfollow User
      await User.findByIdAndUpdate( id , { $pull: { followers : req.user._id}});
      await User.findByIdAndUpdate( req.user._id , { $pull: { following : id}});

      //TODO : return the id of the User as a response
      res.status(200).json({ message : "User unfolllowed succesfully"});
    } else {
      // Follow User
      await User.findByIdAndUpdate( id , { $push: { followers : req.user._id}});
      await User.findByIdAndUpdate( req.user._id , { $push: { following : id}});
      // Send Notification to the user
      const newNotification = new Notification({
        type : "follow",
        from: req.user._id,
        to: userToModify,
      })
      await newNotification.save();

      //TODO : return the id of the User as a response
      res.status(200).json({ message : "User followed succesfully"});
    }
  }
  catch(err){
    console.log("Error in followUnfollowUser controller",err.message);
    res.status(500).json({ error : "Internal Server Error"});
  } 
}

export const getSuggestedUsers = async (req,res) => {
  try {
    const userId = req.user._id;

    // We dont Suggest the users Whom we are already Following
    const usersFollowedByMe = await User.findById(userId).select("following");

    const users = await User.aggregate([
      {
        $match:{
          _id: {$ne:userId} // We should not suggest ourselves as well as following
        }
      },
      {
        $sample:{
          size:10
        }
      } // Gives a random sample of 10 users
    ])
    //filters users that we already follow from that sample
    const filteredUsers = users.filter((user)=>!usersFollowedByMe.following.includes(user._id));
    const suggestedUsers = filteredUsers.slice(0,4)

    suggestedUsers.forEach(user=>user.password=null);

    res.status(200).json(suggestedUsers);
  }
  catch(err){
    console.log("Error in getSuggestedUser controller",err.message);
    res.status(500).json({ error : "Internal Server Error"});
  }
}

export const updateUser = async (req,res) => {
  const {fullName,email,username,currentPassword,newPassword,bio,link} = req.body;
  let {profileImg,coverImg} = req.body;

  const userId = req.user._id;

  try {
    let user = await User.findById(userId);
    if(!user){
      return res.status(404).json({error:"User Not Found"});
    }
    //Chnaging Password
    if((!newPassword && currentPassword)||(!currentPassword && newPassword)){
      return res.status(404).json({error:"Please provide both current password and new password"});
    }

    if(currentPassword && newPassword){
      const isMatch = await bcrypt.compare(currentPassword,user.password);
      if(!isMatch){
        return res.status(400).json({error:"Current password is incorrect"});
      }
      if(newPassword.length < 6){
        return res.status(400).json({error:"Password must be atleast 6 characters"});
      }

      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword,salt);
    }
    // Profile Img Using Cloudinary
    if(profileImg){
      if(user.profileImg){
        await cloudinary.uploader.destroy(user.profileImg.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(profileImg) // Uploads Image in Cloud and return a response containing url which we can store it in database and the same url is used to get that access again
      profileImg = uploadedResponse.secure_url;
    }
    // Cover Img
    if(coverImg){
      if(user.profileImg){
        await cloudinary.uploader.destroy(user.coverImg.split("/").pop().split(".")[0]);
      }
      const uploadedResponse = await cloudinary.uploader.upload(coverImg)
      coverImg = uploadedResponse.secure_url;
    }

    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.link = link || user.link;
    user.profileImg = profileImg || user.profileImg;
    user.coverImg = coverImg || user.coverImg;
    
    user = await user.save();
    // password should be null in response
    user.password = null;
    return res.status(200).json(user);

  } catch (err) {
    console.log("Error in updateUser controller",err.message);
    res.status(500).json({ error :err.message});
  }
}