const User = require("../../models/userSchema");


const customerInfo = async (req,res)=>{
    try {
        let search = "";//search button
        if(req.query.search){
            search = req.query.search;
        }
        let page =1;   // pagination
        if(req.query.page){
            page = req.query.page;
        }
        const limit= 3

        // Get dashboard statistics
        const totalCustomers = await User.countDocuments({ isAdmin: false });
        const activeCustomers = await User.countDocuments({ isAdmin: false, isBlocked: false });
        const blockedCustomers = await User.countDocuments({ isAdmin: false, isBlocked: true });

        const userData = await User.find({
            isAdmin:false,
            $or:[
                {name:{$regex: ".*" + search + ".*"}},
                {email:{$regex: ".*" + search + ".*"}},
            ],
        })
        .limit(limit * 1)
        .skip((page-1) * limit)
        .exec();

        const count = await User.find({   //count pages
            isAdmin:false,
            $or:[
                {name:{$regex:".*"+search+".*"}},
                {email:{$regex:".*"+search+".*"}},
            ],
        }).countDocuments();

        res.render('admin/customer',{
            data:userData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
            search:search,
            dashboardStats: {
                totalCustomers,
                activeCustomers,
                blockedCustomers
            }
        })
        
    } catch (error) {
        res.redirect("/pageerror")
    }
};




const customerBlocked = async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/users")
    } catch (error) {
        res.redirect("/pageerror")
    }
};

const customerunBlocked =async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/users")
    } catch (error) {
        res.redirect("/pageerror")
    }
}


module.exports ={
    customerInfo,
    customerBlocked,
    customerunBlocked
}