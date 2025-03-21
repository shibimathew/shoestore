const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")

// const pageNotFound = async(req,res)=>{
//     try{
//         res.render("user/page-404.ejs")
//     }catch (error) {
//         res.redirect("/pageNotFound")
        
//     }
   
// };


const loadHomepage = async (req,res)=>{
    try{
        return res.render('user/home');
    }catch (error){
        console.log("Home page not found");
        res.status(404).send("Server error")
    }
};

const loadSignup = async (req,res)=>{
    try {
        return res.render('user/signup')
    }catch (error) {
        console.log("Home page not loading:',error");
        res.status(500).send('Server Error');
    }
}

// const signup = async (req,res)=>{
//     const {name,email,phone,password} = req.body; //destructuring
//     try{
//         const newUser = new User({name,email,phone,password});
//         console.log(newUser); 
//         await newUser.save();
//         return res.redirect("/signup")
//     } catch (error){
//         console.error("Error for save user",error);
//         res.status(500).send('Internal server error')
//     }
// }  

       function generateOtp(){
        return Math.floor(100000 + Math.random()*900000).toString();
       }
       async function sendVerificationEmail(email,otp){
        try{

            const transporter = nodemailer.createTransport({
                service:'gmail',
                port:587,    //gmail port
                secure:false,
                requireTLS:true,
                auth:{
                    user:process.env.NODEMAILER_EMAIL,
                    pass:process.env.NODEMAILER_PASSWORD
                }
            })
            const info = await transporter.sendMail({
                from:process.env.NODEMAILER_EMAIL,
                to:email,
                subject:"Verify your account",
                text:`your OTP is ${otp}`,
                html:`<b>Your OTP: ${otp}</b>`,
            })
        return info.accepted.length >0
        }catch (error){
            console.error("Error sending email",error);
            return false;
        }
       }
      const signup = async (req,res)=>{
          
          try{
              const {email,name,password,cPassword} = req.body; //destructuring
              if(password!==cPassword){
                console.log("workr",cPassword);
                
                  return res.render("user/signup",{message:"Passwords do not match"});
                }
                const findUser = await User.findOne({email});
                if(findUser){
            return res.render("user/signup",{message:"User with this email already exists"});
        }
        const otp =generateOtp();
        const emailSent = await sendVerificationEmail(email,otp);
        if(!emailSent){
            return res.json("email-error")
        }
        req.session.userOtp=otp;
        req.session.userDate={email,password};

        // res.render("verify-otp");
        console.log("OTP Sent",otp);


       }catch (error){
        console.error("signup error",error)
        res.redirect("/pageNotFound")

       }
}


// const loadShopping = async (req, res) => {
//     try {
//         return res.render('shop'); // Ensure shop.ejs exists
//     } catch (error) {
//         console.log("Error loading shop page:", error);
//         res.status(500).send('Server Error');
//     }
// };

module.exports={
    loadHomepage,
    // pageNotFound,
    loadSignup,
    signup,
    // loadShopping
    
};