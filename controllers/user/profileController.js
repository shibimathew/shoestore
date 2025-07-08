const User = require("../../models/userSchema");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const env = require("dotenv").config();
const session = require("express-session");
const { text } = require("express");

// const userProfile = async (req,res) =>{
//     try {
//         const userId = req.session.user;
//         const userData = await user.findById(userId);
//         res.render("profile",{
//             user:userData,
//         })
//     } catch (error) {
//         console.error("Error for retrieve profile data",error);
//         res.redirect("/pageNotFound")
        
//     }
// }

function generateOtp(){   //generating globally
    const digits = "1234567890";
    let otp= "";
    for(let i=0;i<6;i++){
        otp+=digits[Math.floor(Math.random()*10)];
    }
    return otp;
}

const sendVerificationEmail = async (email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:"gmail",
            port:587,
            secure : false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,
            }
        })

        const mailOptions = {
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:"Your OTP for password reset",
            text:`Your OTP is ${otp}`,
            html:`<b><h4>Your OTP :${otp}</h4><br></b>`
            }
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:",info.messageId);
        return true;


    } catch (error) {
        console.error("Error sending email",error);
        return false;
    }
}
const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        
    }
}
const getForgotPassPage = async (req,res)=>{
    try {
        res.render("user/forgot-password");
        
    } catch (error) {
        res.redirect("/pageNotFound")
    }
};


const forgotEmailValid = async (req,res)=>{
    try {
      const {email} = req.body;
      const findUser = await User.findOne({email:email});
      if(findUser){
        const otp = generateOtp();
        console.log(otp)
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            req.session.userOtp = otp;
            req.session.email = email;
            res.render("user/forgot-email-valid");
            console.log("OTP:",otp);
        }else{
            res.json({success:false,message:"Failed to send OTP.Please try again"});
        }

      }else{
        res.render("user/forgot-password",{
            message:"User with this email does not exist"
        });
      }
    } catch (error) {
        res.redirect("/pageNotFound");
    }
}

const verifyForgotPassOtp = async (req,res)=>{

    try {
        const enteredOtp = req.body.otp;
        if(enteredOtp=== req.session.userOtp){
            res.json({success:true,redirectUrl:"/reset-password"});

        }else{
            res.json({success:false,message:"OTP not matching"});
        }
    } catch (error) {
        res.status(500).json({success:false, message:"An error occured. Please try again."});
    }
}

const getResetPassPage = async (req,res)=>{
    try {
        console.log("Rendering reset-password page"); 
        res.render('user/reset-password');
        
    } catch (error) {
        res.redirect('/pageNotFound');
    }
}

const resendOtp = async (req,res)=>{
    try {
        const otp = generateOtp();
        req.session.userOtp= otp;
        const email = req.session.email;
        console.log("Resending Otp to email:",email);
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
            console.log("Resend OTP:",otp);
            res.status(200).json({success:true, message:'Resend  OTP successful'})
        }
    } catch (error) {
        console.error("Error in resend otp",error);
        res.status(500).json({success: false , message:'Internal Server Error'});
    }
}


const postNewPassword = async (req,res)=>{
    try {
        const {newPass1,newPass2}= req.body;
        const email = req.session.email;
        if(newPass1===newPass2){
            const passwordHash = await securePassword(newPass1);
            await User.updateOne(
                {email:email},
                {$set:{password:passwordHash}}
            );
            // Clear the session data
            req.session.destroy((err) => {
                if(err) {
                    console.error("Error destroying session:", err);
                }
                // Send success response with redirect URL
                res.json({
                    success: true,
                    message: "Password changed successfully!",
                    redirectUrl: "/login"
                });
            });
        }else{
            res.json({
                success: false,
                message: "Passwords do not match"
            });
        }
    } catch (error) {
        console.error("Error in postNewPassword:", error);
        res.json({
            success: false,
            message: "An error occurred while changing password"
        });
    }
}






module.exports = {
    getForgotPassPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassPage,
    resendOtp,
    postNewPassword
};