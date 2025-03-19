const User = require("../../models/userSchema");

// const pageNotFound = async(req,res)=>{
//     try{
//         res.render("user-1/page-404.ejs")
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
        return res.render('user/signup.ejs')
    }catch (error) {
        console.log("Home page not loading:',error");
        res.status(500).send('Server Error');
    }
}

const signup = async (req,res)=>{
    const {name,email,phone,password} = req.body; //destructuring
    try{
        const newUser = new User({name,email,phone,password});
        console.log(newUser); 
        await newUser.save();
        return res.redirect("/signup")
    } catch (error){
        console.error("Error for save user",error);
        res.status(500).send('Internal server error')
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