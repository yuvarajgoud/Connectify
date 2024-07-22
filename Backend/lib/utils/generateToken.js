import jwt from "jsonwebtoken"

export const generateTokenAndSetCookie = (userId,res) => {
  const token = jwt.sign({userId},process.env.JWT_SECRET,{ // Takes payload and secretKey
    expiresIn:"15d"
  });

  res.cookie("jwt",token,{
    maxAge : 15*24*60*60*1000, // milliseconds
    httpOnly : true, // prevemt XSS attacks cross-site scripting attacks
    sameSite : "strict" , // CSRF sttacks cross-site request forgery attacks
    secure : process.env.NODE_ENV !== "development",
  })
}