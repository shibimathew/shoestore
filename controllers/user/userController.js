const User = require("../../models/userSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")

const pageNotFound = async(req,res)=>{
    try{
        res.render("user/page-404.ejs")
    }catch (error) {
        res.redirect("/pageNotFound")
        
    }
   
};


const loadHomepage = async (req,res)=>{
    try{
        const user = req.session.user;
        if(user){
            const userData = await User.findOne({_id:user._id});
            res.render("user/home",{user:userData})
        }else{
            return res.render('user/home');
        }
        
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
              const {name,email,phone,password,cPassword} = req.body; //destructuring
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
        req.session.userData={name,phone,email,password};

        res.render("user/verify-otp");
        console.log("OTP Sent",otp);


       }catch (error){
        console.error("signup error",error)
        res.redirect("/pageNotFound")

       }
}
const securePassword = async(password)=>{
    try {

        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash;
        
    } catch (error) {
        
    }
}
const verifyOtp = async(req,res)=>{
    try {
        const {otp}=req.body;
        console.log(otp);
        if(otp===req.session.userOtp){
            const user=req.session.userData
            const passwordHash = await securePassword(user.password)

            const saveUserData = new User({
                name:user.name,
                email:user.email,
                phone:user.phone,
                password:passwordHash
            })
            await saveUserData.save();
            req.session.user = saveUserData._id;
            res.json({success:true,redirectUrl:"/"})
        }else{
            res.status(400).json({success:false,message:"Invalid Otp, Please try again"})
        }
    } catch (error) {
        console.error("Error Verifying OTP",error);
        res.status(500).json({success:false,message:"An error occured"})
        
    }
}


const resendOtp = async (req,res)=>{
    try {

        const {email} = req.session.userData;
        if(!email){
            return res.status(400).json({success:false,message:"Email not found in session"})
        }
        const otp = generateOtp();
        req.session.userOtp = otp;
        
        const emailSent = await sendVerificationEmail(email,otp);
        if(emailSent){
          console.log("Resend OTP:",otp);
          res.status(200).json({success:true,message:"OTP Reset Successfully"})
          
        }else{
            res.status(500).json({success:false,message:"Failed to resend OTP.please try again"})
        }
    } catch (error) {

        console.error("Error resending OTP",error);
        res.status(500).json({success:false,message:"Internal Server Error.Please try again"})
        
    }
};


const loadLogin = async (req,res)=>{
    try {
        if(!req.session.user){
            return res.render('user/login');
        }else{
            res.redirect("/")
        }
    } catch (error) {
        res.redirect("pageNotFound");
        
    }
};


const login = async (req,res)=>{
    try {
        const {email,password} = req.body;

        const findUser = await User.findOne({isAdmin:0,email:email});
        if(!findUser){
            return res.render("user/login",{message:"User not found"})
        }
        if(findUser.isBlocked){
            return res.render("user/login",{message:"User is blocked by admin"})
        }

        const  passwordMatch = await bcrypt.compare(password,findUser.password);
        if(!passwordMatch){
            return res.render("user/login",{message:"Incorrect Password"})
        }

        req.session.user = findUser;
        res.redirect("/")
    } catch (error) {
        console.error("login error",error)
        res.render("user/login",{message:"login failed. Please try again later"})
        
    }

};


const logout = async (req,res) =>{
    try {
        req.session.destroy((err)=>{
            if(err){
                console.log("Session destruction error",err.message);
                return res.redirect("/pageNotFound")
            }
            return res.redirect("user/login")
        })
        
    } catch (error) {
        console.log("Logout error",error);
        res.redirect("/pageNotFound")
    }
}

// const loadShoppingPage = async (req, res) => {
//     try {
//         return res.render('shop'); // Ensure shop.ejs exists
//     } catch (error) {
//        res.redirect("/pageNotFound")
//     }
// };
const loadShoppingPage = async(req,res)=>{
    try {
        const user = req.session.user;
        const userData = await User.findOne({_id:user});
        const categories = await Category.find({isListed:true});
        
        // Get sort parameter from query
        const sortOption = req.query.sort;
        const searchQuery = req.query.query || "";
        
        // Define sort object based on sort option
        let sortObject = { createdAt: -1 }; // Default sort
        
        if (sortOption === 'price_low') {
            sortObject = { salePrice: 1 }; // Sort by price low to high
        } else if (sortOption === 'price_high') {
            sortObject = { salePrice: -1 }; // Sort by price high to low
        }
        
        let query = {
            isBlocked: false,
            category: {$in: categories.map(cat => cat._id)}
        };

        // Add search query if it exists
        if (searchQuery) {
            query.productName = { $regex: ".*" + searchQuery + ".*", $options: "i" };
        }
        
        const products = await Product.find(query)
        .populate('category')
        .sort(sortObject)
        .lean();

        // Pagination setup
        const page = parseInt(req.query.page) || 1;
        const itemsPerPage = 6;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(products.length / itemsPerPage);
        const currentProduct = products.slice(startIndex, endIndex);

        res.render("shop", {
            user: userData,
            products: currentProduct,
            category: categories,
            totalProducts: products.length,
            currentPage: page,
            totalPages: totalPages,
            selectedCategory: null,
            sortOption: sortOption, // Pass sort option to view
            searchQuery: searchQuery // Pass search query to view
        });

    } catch (error) {
        console.error("Error in loadShoppingPage:", error);
        res.redirect("/pageNotFound");
    }
}

module.exports={
    loadHomepage,
    pageNotFound,
    loadSignup,
    signup,
    verifyOtp,
    resendOtp,
    loadLogin,
    login,
    logout,
    loadShoppingPage,
    
};