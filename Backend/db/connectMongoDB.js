import mongoose from "mongoose";

const connectMongoDB = async ()=>{
  try{
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected : ${conn.connection.host}`);
  }
  catch(err){
    console.error(`Error Connecting to MongoDB :${err.message}`);
    process.exit(1);
  }
}

export default connectMongoDB;