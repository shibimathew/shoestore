// const User = require("../models/userSchema");
// const userAuth = (req,res,next)=>{
//     if(req.session.user){
//         User.findById(req.session.user)
//         .then(data=>{
//             if(data && !data.isBlocked){
//                 next()
//             }else{
//                 // If user is blocked, destroy the session and redirect to login
//                 req.session.destroy((err) => {
//                     if(err) {
//                         console.error("Error destroying session:", err);
//                     }
//                     res.redirect("/login?message=Your account has been blocked. Please contact support.");
//                 });
//             }
//         })
//         .catch(error=>{
//             console.log("Error in user auth middleware");
//             res.status(500).send("Internal Server error")
//         })
//     }else{
//         res.redirect("/login")
//     }
// }

// const adminAuth =( req,res,next)=>{
//     User.findOne({isAdmin:true})
//     .then(data=>{
//         if(data){
//             next();
//         }else{
//             res.redirect("/admin/login")
//         }
//     })
//     .catch(error=>{
//         console.log("Error in adminauth middleware",error);
//         res.status(500).send("Internal Server Error")
//     })
// }
// module.exports ={
//     userAuth,
//     adminAuth
// }

const User = require("../models/userSchema");

const userAuth = (req, res, next) => {
    const user = req.session.user || req.user || null;
    if (user) {
        User.findById(user._id)
            .then(user => {
                if (user && !user.isBlocked) {
                    next();
                } else {
                    req.session.destroy((err) => {
                        if (err) console.error("Error destroying session:", err);
                        res.redirect("/login?message=Your account has been blocked. Please contact support.");
                    });
                }
            })
            .catch(error => {
                console.error("Error in userAuth middleware:", error);
                res.status(500).send("Internal Server Error");
            });
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
