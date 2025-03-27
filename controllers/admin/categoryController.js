const Category = require("../../models/categorySchema")



const categoryInfo =  async (req,res)=>{
    try {
        const page = parseInt(req.query.page)||1;// parsing the url
        const limit = 4;
        const skip = (page-1)*limit;

        const categoryData  = await Category.find({})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit);

        const totalCategories = await Category.countDocuments();
        const totalPages = Math.ceil(totalCategories/limit);
        res.render("admin/category",{
        cat:categoryData,
        currentPage:page,
        totalPages : totalPages,
        totalCategories: totalCategories
    });
    } catch (error) {
        console.error(error);
        res.redirect("/pageerror")
        
    }
}

const addCategory = async (req,res)=>{
    const {name,description,categoryOffer} = req.body;
    try {
        const existingCategory = await Category.findOne({name});
        if(existingCategory){
            return res.status(400).json({error:"Category already exists"})
        }
        const newCategory = new Category({
            name,
            description,
            
        })
        await newCategory.save();
        return res.json({message:"Category added successfully"})
    } catch (error) {
        return res.status(500).json({error:"Internal Server Error"})
        
    }
}
const getListCategory = async (req,res)=>{
    try {

        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:true}});
        res.redirect("/admin/category");

    } catch (error) {

        res.redirect('/admin/pageerror');
        
    }
}

const getUnlistCategory = async (req,res)=>{
    try {

        let id = req.query.id;
        await Category.updateOne({_id:id},{$set:{isListed:false}});
        res.redirect("/admin/category");
        
    } catch (error) {

        res.redirect('/admin/pageerror');
        
    }
}


module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory
}