const User = require("../../models/userSchema");
const Category = require("../../models/categorySchema");
const Product = require("../../models/productSchema");
// const Brand = require("../../models/BrandSchema");
const env = require("dotenv").config();
const nodemailer = require("nodemailer")
const bcrypt = require("bcrypt")
const Cart = require("../../models/cartSchema.js")

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const pageNotFound = async(req,res)=>{
    try{
        res.render("user/page-404.ejs")
    }catch (error) {
        res.redirect("/pageNotFound")
        
    }
   
};


// const loadHomepage = async (req, res) => {
//     try {
//         let userData = null;
//         const user = req.session.user || req.user || null;
//         if (user) {
//             userData = await User.findOne({ _id: user._id });
//         }
        
//         // Get featured products
//         const featuredProducts = await Product.find({
//             isListed: true,
//             quantity: { $gt: 0 }
//         })
//         .sort({ createdOn: -1 })
//         .limit(8)
//         .lean();

//         // Get categories
//         const categories = await Category.find({ isListed: true }).lean();

//         res.render('user/home', {
//             user: userData,
//             featuredProducts,
//             categories,
//             message: req.query.message || null
//         });
//     } catch (error) {
//         console.error("Error loading homepage:", error);
//         res.redirect('/pageNotFound');
//     }
// };
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
        
        // Get featured products
        const featuredProducts = await Product.find({
            isListed: true,
            category: { $in: categories.map(category => category._id) }
        })
        .sort({ createdAt: -1 })
        .limit(8)
        .populate('category');
        
        // Get cart if user is logged in
        let cart = null;
        let items = [];
        if (userId) {
            cart = await Cart.findOne({userId : userId})
                .populate('items.productId');
            items = cart?.items || [];
        }

        res.render('user/home', {
            user: userData,
            featuredProducts,
            categories,
            items,
            message: req.query.message || null
        });
    } catch (error) {
        console.error("Error loading homepage:", error);
        res.status(500).send("Server error");
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
                
                
                  return res.render("user/signup",{message:"Passwords do not match"});
                }
                
                // Check if user already exists
                const findUser = await User.findOne({email});
                if(findUser){
                    // Check if this is a Google-authenticated user
                    if(findUser.googleId) {
                        return res.render("user/signup",{message:"This email is already registered with Google. Please use Google login instead."});
                    } else {
                        return res.render("user/signup",{message:"User with this email already exists"});
                    }
                }
                
                const otp = generateOtp();
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
            
            // Check if user already exists (in case they registered while OTP was being sent)
            const existingUser = await User.findOne({email: user.email});
            if(existingUser) {
                return res.status(400).json({
                    success: false, 
                    message: "This email is already registered. Please login instead."
                });
            }
            
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
            // Check if there's a message in the query parameters
            const message = req.query.message || null;
            return res.render('user/login', { message });
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

        // Check if this is a Google-authenticated user
        if(findUser.googleId && !findUser.password) {
            return res.render("user/login",{message:"This account was created using Google. Please use Google login instead."})
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
            return res.redirect("/")
        })
        
    } catch (error) {
        console.log("Logout error",error);
        res.redirect("/pageNotFound")
    }
}

const loadShoppingPage = async (req, res) => {
    
    try {
        const user = req.session.user||req.user||null;
       
        const userData = user ? await User.findOne({_id:user}) : null;
        const categories = await Category.find({isListed:true});
        const categoryIds = categories.map((category)=>category._id.toString());
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const skip = (page-1) * limit;
        
        // Get sort parameter from query
        const sort = req.query.sort || 'newest';
        const selectedCategory = req.query.category || '';
        
        // Define sort options
        let sortOption = {};
        switch(sort) {
            case 'price_asc':
                sortOption = { salePrice: 1 };
                break;
            case 'price_desc':
                sortOption = { salePrice: -1 };
                break;
            case 'name_asc':
                sortOption = { productName: 1 };
                break;
            case 'name_desc':
                sortOption = { productName: -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdOn: -1 };
                break;
        }

        const query = {
            isListed: true,
            category: { $in: categoryIds },
            // quantity: { $gt: 0 },
        };

        if (selectedCategory) {
            query.category = selectedCategory;
        }

        const products = await Product.find(query)
            .populate("category")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts/limit);
        const categoriesWithIds = categories.map(category => ({_id:category._id, name:category.name}));
        console.log(req.session.user || req.user)

        res.render('user/shop', {
            user: userData,
            products: products,
            category: categoriesWithIds,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
            currentSort: sort,
            selectedCategory: selectedCategory,
            priceRange: {
                gt: req.query.gt || '',
                lt: req.query.lt || ''
            }
        });
    } catch (error) {
        console.error("Error in loadShoppingPage:", error);
        res.redirect("/pageNotFound");
    }
};


const filterProduct = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = user ? await User.findOne({_id:user}) : null;
        const categories = await Category.find({isListed:true});
        const categoryIds = categories.map((category)=>category._id.toString());
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page-1) * limit;
        
        // Get sort parameter from query
        const sort = req.query.sort || 'newest';
        
        // Define sort options
        let sortOption = {};
        switch(sort) {
            case 'price_asc':
                sortOption = { salePrice: 1 };
                break;
            case 'price_desc':
                sortOption = { salePrice: -1 };
                break;
            case 'name_asc':
                sortOption = { productName: 1 };
                break;
            case 'name_desc':
                sortOption = { productName: -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdOn: -1 };
                break;
        }

        const categoryId = req.query.category;
        const query = {
            isListed: true,
            category: { $in: categoryIds },
            // quantity: { $gt: 0 },
        };

        if (categoryId) {
            query.category = categoryId;
        }

        const products = await Product.find(query)
            .populate("category")
            .sort(sortOption)
            .skip(skip)
            .limit(limit);

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts/limit);
        const categoriesWithIds = categories.map(category => ({_id:category._id, name:category.name}));

        res.render('user/shop', {
            user: userData,
            products: products,
            category: categoriesWithIds,
            totalProducts: totalProducts,
            currentPage: page,
            totalPages: totalPages,
            currentSort: sort,
            selectedCategory: categoryId,
            priceRange: {
                gt: req.query.gt || '',
                lt: req.query.lt || ''
            }
        });
    } catch (error) {
        console.error("Error in filterProduct:", error);
        res.redirect("/pageNotFound");
    }
};


const filterByPrice = async (req,res)=>{
    try {
        const user = req.session.user;
        const userData  = await User.findOne({_id:user});
        const categories = await Category.find({isListed:true}).lean();
        const categoryId = req.query.category;
        const sort = req.query.sort || 'newest';
        const gt = req.query.gt;
        const lt = req.query.lt;

        // Build query object
        const query = {
            salePrice: {$gt: Number(gt), $lt: Number(lt)},
            isListed: true, 
            // quantity: {$gt: 0}
        };

        // Add category filter if provided
        if (categoryId) {
            query.category = categoryId;
        }

        // Define sort options
        let sortOption = {};
        switch(sort) {
            case 'price_asc':
                sortOption = { salePrice: 1 };
                break;
            case 'price_desc':
                sortOption = { salePrice: -1 };
                break;
            case 'name_asc':
                sortOption = { productName: 1 };
                break;
            case 'name_desc':
                sortOption = { productName: -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdOn: -1 };
                break;
        }

        let findProducts = await Product.find(query)
            .populate("category")
            .sort(sortOption)
            .lean();

        let itemsPerPage = 6;
        let currentPage = parseInt(req.query.page)||1;
        let startIndex = (currentPage-1) * itemsPerPage;
        let endIndex = startIndex+itemsPerPage;
        let totalPages = Math.ceil(findProducts.length/itemsPerPage); 
        const currentProduct = findProducts.slice(startIndex,endIndex);
        req.session.filteredProducts = findProducts;

        res.render('user/shop',{
            user: userData,
            products: currentProduct,
            category: categories,
            totalPages,
            currentPage,
            selectedCategory: categoryId,
            currentSort: sort,
            priceRange: {
                gt: gt,
                lt: lt
            }
        });

    } catch (error) {
        console.log(error);
        res.redirect("/pageNotFound");
    }
}

const searchProducts = async (req, res) => {
    try {
        const user = req.session.user;
        const userData = user ? await User.findOne({ _id: user }) : null;
        const searchQuery = req.body.query?.trim() || '';

        // Fetch categories
        const categories = await Category.find({ isListed: true }).lean();
        const categoryIds = categories.map(category => category._id.toString());

        // Base query conditions
        const query = {
            isListed: true,
            quantity: { $gt: 0 },
            category: { $in: categoryIds }
        };

        // Add search term if provided
        if (searchQuery) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }

        // Handle filtered products from session if they exist
        let products = [];
        if (req.session.filteredProducts?.length > 0 && searchQuery) {
            products = req.session.filteredProducts.filter(product =>
                product.productName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        } else {
            products = await Product.find(query)
                .populate("category")
                .lean()
                .sort({ createdOn: -1 });
        }

        // Pagination
        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(products.length / itemsPerPage);
        const currentProducts = products.slice(startIndex, endIndex);
        const currentSort = req.query.sort || "newest";
        const selectedCategory = req.query.selectedCategory || " ";
        const priceRange = req.query.priceRange || "";



        // Render response
        res.render("user/shop", {
            user: userData,
            products: currentProducts,
            category: categories,
            totalPages,
            currentPage,
            currentSort,
            searchQuery,
            selectedCategory,
            priceRange,   
            count: products.length,
        });

    } catch (error) {
        console.error("Search Error:", error);
        res.redirect("/pageNotFound");
    }
};

const productFilter = async (req, res) => {
    try {
        const user = req.session.user;
        const category = req.query.category;
        const priceMin = req.query.gt || req.query.min;
        const priceMax = req.query.lt || req.query.max;
        const searchQuery = req.body.query?.trim() || req.query.search?.trim() || '';
        const sortBy = req.query.sort || 'newest'; // default sort by newest
        
        // Build query object
        const query = {
            isListed: true,
            quantity: { $gt: 0 }
        };
        
        // Apply category filter
        if (category) {
            const findCategory = await Category.findOne({ _id: category });
            if (findCategory) {
                query.category = findCategory._id;
            }
        }
        
        // Apply price filter
        if (priceMin || priceMax) {
            query.salePrice = {};
            if (priceMin) query.salePrice.$gte = Number(priceMin);
            if (priceMax) query.salePrice.$lte = Number(priceMax);
        }
        
        // Apply search filter
        if (searchQuery) {
            query.productName = { $regex: searchQuery, $options: 'i' };
        }
        
        // Fetch products based on query
        let findProducts = await Product.find(query).lean();
        
        // Apply sorting
        switch (sortBy) {
            case 'newest':
                findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            case 'oldest':
                findProducts.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'price-low':
                findProducts.sort((a, b) => a.salePrice - b.salePrice);
                break;
            case 'price-high':
                findProducts.sort((a, b) => b.salePrice - a.salePrice);
                break;
            case 'name-asc':
                findProducts.sort((a, b) => a.productName.localeCompare(b.productName));
                break;
            case 'name-desc':
                findProducts.sort((a, b) => b.productName.localeCompare(a.productName));
                break;
            default:
                findProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        
        // Get categories for sidebar
        const categories = await Category.find({ isListed: true })
        .populate("category")
        .lean();
        
        // Pagination
        const itemsPerPage = 6;
        const currentPage = parseInt(req.query.page) || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const totalPages = Math.ceil(findProducts.length / itemsPerPage);
        const currentProducts = findProducts.slice(startIndex, endIndex);
        
        // Save search history if user is logged in
        let userData = null;
        if (user) {
            userData = await User.findOne({ _id: user });
            if (userData && category) {
                const searchEntry = {
                    category: category,
                    searchedOn: new Date(),
                };
                userData.searchHistory.push(searchEntry);
                await userData.save();
            }
        }
        
        // Save filtered products in session
        req.session.filteredProducts = currentProducts;
        
        // Render shop page with filters applied
        res.render("user/shop", {
            user: userData,
            products: currentProducts,
            category: categories,
            totalPages,
            currentPage,
            selectedCategory: category || null,
            selectedSort: sortBy,
            priceMin: priceMin || '',
            priceMax: priceMax || '',
            searchQuery: searchQuery || '',
            count: findProducts.length
        });
        
    } catch (error) {
        console.error("Filter Error:", error);
        res.redirect("/pageNotFound");
    }
};


const googleFunctiion = async (req, res, next)=>{
    passport.authenticate('google', function(err, user, info) {
        // Handle errors from the strategy
        if (err) {
            console.error("Google authentication error:", err);
            return res.redirect('/login?error=google-auth-failed');
        }
        
        // Handle case where user is false (likely blocked)
        if (!user) {
            if (info && info.message) {
                // This handles the blocked user case
                return res.redirect('/login?message=' + encodeURIComponent(info.message));
            } else {
                return res.redirect('/login?error=google-auth-failed');
            }
        }
        
        // Log in the user if everything is fine
        req.login(user, function(err) {
            if (err) {
                console.error("Session login error:", err);
                return res.redirect('/login?error=login-failed');
            }
            
            // Store user in session
            req.session.user = {
                _id: user._id,
                name: user.name,
                email: user.email
            };
            
            // Successful authentication, redirect home
            return res.redirect('/');
        });
    })(req, res, next);
};



module.exports={
    productFilter,
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
    filterProduct,
    filterByPrice,
    searchProducts,
    googleFunctiion
};