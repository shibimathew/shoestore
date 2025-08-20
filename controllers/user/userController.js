const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Cart = require("../../models/cartSchema.js");
const Wallet = require("../../models/walletSchema.js")

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const pageNotFound = async (req, res) => {
  try {
    res.render("user/page-404.ejs");
  } catch (error) {
    res.redirect("/pageNotFound");
  }
};

const loadHomepage = async (req, res) => {
  try {
    // Get user data if logged in
    let userData = null;
    const userId = req.session.user;
    if (userId) {
      userData = await User.findById(userId);
    }
    // Get categories for filtering products
    const categories = await Category.find({ isListed: true });

    const featuredProducts = await Product.find({
      isListed: true,
      category: { $in: categories.map((category) => category._id) },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate("category");

    let cart = null;
    let items = [];
    if (userId) {
      cart = await Cart.findOne({ userId: userId }).populate("items.productId");
      items = cart?.items || [];
    }
    req.session.coupon = null;

    res.render("user/home", {
      user: userData,
      featuredProducts,
      categories,
      items,
      message: req.query.message || null,
    });
  } catch (error) {
    console.error("Error loading homepage:", error);
    res.status(500).send("Server error");
  }
};

const loadSignup = async (req, res) => {
  try {
    return res.render("user/signup");
  } catch (error) {
    console.log("Home page not loading:',error");
    res.status(500).send("Server Error");
  }
};

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
async function sendVerificationEmail(email, otp) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587, //gmail port
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: "Verify your account",
      text: `your OTP is ${otp}`,
      html: `<b>Your OTP: ${otp}</b>`,
    });
    return info.accepted.length > 0;
  } catch (error) {
    console.error("Error sending email", error);
    return false;
  }
}
function generateReferralCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const timestamp = Date.now().toString(); // e.g., '1722787200000'
  
  let code = '';
  for (let i = 0; i < 6; i++) {
    // Use timestamp digits to get some pseudo-randomness
    const index = (parseInt(timestamp[i % timestamp.length]) + i * 7) % chars.length;
    code += chars[index];
  }

  return code;
}

const signup = async (req, res) => {
  console.log(req.body)
  try {
    const { name, email, phone, password, cPassword, referralcode } = req.body; //destructuring
    if (password !== cPassword) {
      return res.render("user/signup", { message: "Passwords do not match" });
    }

    const findUser = await User.findOne({ email });
   
    if (findUser) {
      if (findUser.googleId) {
        return res.render("user/signup", {
          message:
            "This email is already registered with Google. Please use Google login instead.",
        });
      } else {
      
        return res.render("user/signup", {
          message: "User with this email already exists",
        });
      }
    }
    if(referralcode){
    const rcode = await User.findOne({referralCode:referralcode});
    if(!rcode){
      return res.render("user/signup",{
        message:"Invalid referral code,user with this referral code does not exists"
      })
    }
    }
    const code = generateReferralCode();
    const otp = generateOtp();
    const emailSent = await sendVerificationEmail(email, otp);
    if (!emailSent) {
      return res.json("email-error");
    }
    console.log("Reached here 1");
    req.session.userOtp = otp;
    req.session.userData = { name, phone, email, password,code };
    if(referralcode){
           req.session.userData.referralcode = referralcode
    }
    console.log("Reached here");

    res.render("user/verify-otp");
    console.log("OTP Sent", otp);
  } catch (error) {
    console.error("signup error", error);
    res.redirect("/pageNotFound");
  }
};
const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
  } catch (error) {}
};
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log(otp);
    if (otp === req.session.userOtp) {
      const user = req.session.userData;

      const existingUser = await User.findOne({ email: user.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "This email is already registered. Please login instead.",
        });
      }

       if (user.referralcode) {
  const refUser = await User.findOne({ referralCode: user.referralcode });

  if (refUser) {
    const walletEntry = new Wallet({
      userId: refUser._id,
     
      payment_type: 'referral',
      amount: 10,
      status: 'completed',
      entryType: 'CREDIT',
      type: 'referral',
    });

    await walletEntry.save();
  }
}


      const passwordHash = await securePassword(user.password);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        phone: user.phone,
        password: passwordHash,
        referralCode: user.code,
      });
      await saveUserData.save();
      req.session.user = saveUserData;
      // req.session.user = saveUserData._id;
      res.json({ success: true, redirectUrl: "/" });
    } else {
      res
        .status(400)
        .json({ success: false, message: "Invalid Otp, Please try again" });
    }
  } catch (error) {
    console.error("Error Verifying OTP", error);
    res.status(500).json({ success: false, message: "An error occured" });
  }
};

const resendOtp = async (req, res) => {
  try {
    const { email } = req.session.userData;
    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email not found in session" });
    }
    const otp = generateOtp();
    req.session.userOtp = otp;

    const emailSent = await sendVerificationEmail(email, otp);
    if (emailSent) {
      console.log("Resend OTP:", otp);
      res
        .status(200)
        .json({ success: true, message: "OTP Reset Successfully" });
    } else {
      res
        .status(500)
        .json({
          success: false,
          message: "Failed to resend OTP.please try again",
        });
    }
  } catch (error) {
    console.error("Error resending OTP", error);
    res
      .status(500)
      .json({
        success: false,
        message: "Internal Server Error.Please try again",
      });
  }
};

const loadLogin = async (req, res) => {
  try {
    if (!req.session.user) {
      const message = req.query.message || null;
      return res.render("user/login", { message });
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("pageNotFound");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const findUser = await User.findOne({ isAdmin: 0, email: email });
    if (!findUser) {
      return res.render("user/login", { message: "User not found" });
    }
    if (findUser.isBlocked) {
      return res.render("user/login", { message: "User is blocked by admin" });
    }

    // Check if this is a Google-authenticated user
    if (findUser.googleId && !findUser.password) {
      return res.render("user/login", {
        message:
          "This account was created using Google. Please use Google login instead.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, findUser.password);
    if (!passwordMatch) {
      return res.render("user/login", { message: "Incorrect Password" });
    }

    req.session.user = findUser;
    res.redirect("/");
  } catch (error) {
    console.error("login error", error);
    res.render("user/login", {
      message: "login failed. Please try again later",
    });
  }
};

const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Session destruction error", err.message);
        return res.redirect("/pageNotFound");
      }
      return res.redirect("/");
    });
  } catch (error) {
    console.log("Logout error", error);
    res.redirect("/pageNotFound");
  }
};



const googleFunctiion = async (req, res, next) => {
  passport.authenticate("google", function (err, user, info) {
    // Handle errors from the strategy
    if (err) {
      console.error("Google authentication error:", err);
      return res.redirect("/login?error=google-auth-failed");
    }

    // Handle case where user is false (likely blocked)
    if (!user) {
      if (info && info.message) {
        // This handles the blocked user case
        return res.redirect(
          "/login?message=" + encodeURIComponent(info.message)
        );
      } else {
        return res.redirect("/login?error=google-auth-failed");
      }
    }

    req.login(user, function (err) {
      if (err) {
        console.error("Session login error:", err);
        return res.redirect("/login?error=login-failed");
      }

      req.session.user = {
        _id: user._id,
        name: user.name,
        email: user.email,
      };

      // Successful authentication, redirect home
      return res.redirect("/");
    });
  })(req, res, next);
};

module.exports = {

  loadHomepage,
  pageNotFound,
  loadSignup,
  signup,
  verifyOtp,
  resendOtp,
  loadLogin,
  login,
  logout,
  googleFunctiion,
};
