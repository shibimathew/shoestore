require('dotenv').config();
const User = require('../../models/userSchema');
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const bcrypt = require("bcrypt");
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const cloudinary = require('../../config/cloudinary.js')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

const getAccountInfoPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/user/login');
    }
    const userId = req.session.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.redirect('/user/login');
    }
    res.render('user/user-profile', { user });
  } catch (error) {
    console.error('Error in account info page', error);
    res.redirect('/pageNotFound');
  }
};

const getEditAccountInfoPage = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findById(id);
    if (!user) {
      return res.redirect('/pageNotFound');
    }
    console.log("User details:",user);
    res.render("user/edit-profile", { user });
  } catch (error) {
    console.error('Edit user profile error:', error);
    res.redirect('/pageNotFound');
  }
};

const activeOTPs = new Map();

const requestEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpData = {
      otp,
      email,
      expiresAt: Date.now() + 49000, // 49 seconds
      userId: req.session.user
    };
    
    activeOTPs.set(email, otpData);
    
    console.log('Email Credentials:', {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD ? '[REDACTED]' : undefined
    });
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });
    
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Email Verification OTP',
      html: `
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 49 seconds.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);

    console.log('OTP email sent:', mailOptions);
    console.log('OTP Data:', otpData);
    return res.status(200).json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

// Resend OTP for email change
const resendEmailOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    const otpData = {
      otp,
      email,
      expiresAt: Date.now() + 49000, // 49 seconds
      userId: req.session.user
    };
    
    activeOTPs.set(email, otpData);
    
    console.log('Resend Email Credentials:', {
      user: process.env.NODEMAILER_EMAIL,
      pass: process.env.NODEMAILER_PASSWORD ? '[REDACTED]' : undefined
    });
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_PASSWORD
      }
    });
    
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: 'Email Verification OTP (Resend)',
      html: `
        <h2>Email Verification</h2>
        <p>Your new OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 49 seconds.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
  
    console.log('Resend OTP email sent:', mailOptions);
    console.log('Resend OTP Data:', otpData);

    return res.status(200).json({ success: true, message: 'New OTP sent successfully' });
  } catch (error) {
    console.error('Error resending OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
};

// Verify OTP for email change
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }
    
    const otpData = activeOTPs.get(email);
    if (!otpData) {
      return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    }
    
    if (Date.now() > otpData.expiresAt) {
      activeOTPs.delete(email);
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }
    
    if (otp !== otpData.otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }
    
    activeOTPs.delete(email);
    
    return res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return res.status(500).json({ success: false, message: 'Failed to send OTP', error: error.message });
  }
};

const editProfileInfo = async (req, res) => {

  try {
    console.log(req.body)
    const userId = req.params.id;
    const { fullName, email, phone, gender } = req.body;
    
    if (!fullName || !email || !gender) {
      return res.status(400).json({ message: 'Full name, email, and gender are required' });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Handle profile image upload
    if (req.file) {
      const file = req.file;
      const validMimes = ['image/jpeg', 'image/jpg', 'image/png' , 'image/webp'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!validMimes.includes(file.mimetype)) {
        return res.status(400).json({ message: 'Only JPG, JPEG,PNG and WEBP images are allowed' });
      }
      
      if (file.size > maxSize) {
        return res.status(400).json({ message: 'Image size must be less than 5MB' });
      }
      
   
      
      if(user.profileImage && user.profileImage.includes('cloudinary')){
        const publicId = user.profileImage.split('/').pop().split('.')[0]
        await cloudinary.uploader.destroy(publicId)
      }

      
      const filename = `user-${userId}-${Date.now()}.jpg`;
      const result = await cloudinary.uploader.upload(file.path,{
        folder: 'shoestore_profiles',
        width : 440,
        height : 440,
        crop : 'fill',
        quality : 80
      })
      
      user.profileImage = result.secure_url;
    }
    
    // Update user information
    user.name = fullName;
    user.email = email;
    user.phone = phone || user.phone;
    user.gender = gender;
    
    await user.save();
    
    // Send appropriate response based on request type
  
      return res.status(200).json({ 
        success: true, 
        message: 'Profile updated successfully',
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          gender: user.gender,
          profileImage: user.profileImage
        }
      });
    
  } catch (error) {
    console.error('Error saving user details:', error);
    
    if (req.xhr || req.headers.accept.includes('application/json')) {
      return res.status(500).json({ 
        success: false,
        error: 'Error saving user details', 
        details: error.message 
      });
    } else {
     
      return res.redirect('/profileinfo?error='+ encodeURIComponent('Failed to update profile :' + error.message));
    }
  }
};


const getSecurityPage = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect('/login');
    }
    const userId = req.session.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/login');
    }
    res.render('user/security', { user });
  } catch (error) {
    console.error("Error in getSecurityPage:", error);
    res.redirect('/admin/pageerror');
  }
};

const validatePasswordStrength = (password) => {
  const errors = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must include at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must include at least one lowercase letter");
  }

  if (!/\d/.test(password)) {
    errors.push("Password must include at least one number");
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must include at least one special character");
  }

  return errors;
};

const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user;
    const user = await User.findById(userId);
    if (!user) {
      console.error("User not found with ID:", userId);
      return res.redirect('/login');
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.render('user/security', { message: "Incorrect current password", user });
    }

    if (newPassword !== confirmPassword) {
      return res.render('user/security', { message: "New passwords do not match", user });
    }

    const strengthErrors = validatePasswordStrength(newPassword);
    if (strengthErrors.length > 0) {
      return res.render('user/security', {
        message: "Password does not meet strength requirements: " + strengthErrors.join(", "),
        user
      });
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.render('user/security', {
        message: "New password cannot be the same as your current password",
        user
      });
    }

    const newPasswordHash = await securePassword(newPassword);
    user.password = newPasswordHash;
    await user.save();

    return res.render('user/security', { message: "Password updated successfully.", user });
  } catch (error) {
    console.error("Error in updating password:", error);
    res.status(500).render('user/security', { message: "Server error occurred: " + error.message });
  }
};

const securePassword = async (password) => {
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    return passwordHash;
  } catch (error) {
    console.error("Error in hashing password:", error);
    throw error;
  }
};

const renderSecurityPage = async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.redirect('/login');
    }

    const userId = req.session.user;
    const user = await User.findById(userId);
    if (!user) {
      return res.redirect('/login');
    }

    return res.render('user/security', { user });
  } catch (error) {
    console.error("Error rendering security page:", error);
    return res.status(500).render('error', { message: "Server error occurred: " + error.message });
  }
};

module.exports = {
  getAccountInfoPage,
  getEditAccountInfoPage,
  editProfileInfo,
  requestEmailOTP,
  resendEmailOTP,
  verifyEmailOTP,
  getSecurityPage,
  updatePassword,
  renderSecurityPage
};


