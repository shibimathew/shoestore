

const User = require("../models/userSchema");

const userAuth = async (req, res, next) => {
    const user = req.session.user || req.user || null;
    if (user) {
        const _id = user._id || user.googleId
        const userData = await User.findOne({_id : _id}) || await User.findOne({googleId:_id})
           
                if(userData && !userData.isBlocked){
                    next();
                } else {
                    req.session.destroy((err) => {
                        if (err) console.error("Error destroying session:", err);
                        res.redirect("/login?message=Your account has been blocked. Please contact support.");
                    });
                }
           
          
    } else {
        res.redirect("/login");
    }
};

const adminAuth = (req,res,next)=>{
   try {
    const admin = req.session.admin;
    console.log(admin)
    if(admin){
        next()
    }else{
        res.redirect('/admin/login')
    }
   } catch (error) {
    console.log("Error in adminauth middleware",error);
        res.status(500).send("Internal Server Error");
   }
}

module.exports = {
    userAuth,
    adminAuth
};
