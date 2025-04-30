const Brand = require("../../models.bransSchema");
const Product = require("../../models/productSchema");



conat getBrandPage = async (req,res)=>{
    try {
        const page = parseint(req.query.page) || 1; //pagination
        const limit = 4;
        const skip = (page-1)*limit;
        const brandData = await Brand.find({}).sort({createdAt:-1}).skip(skip).limit(limit);
        const totalBrands = await Brand.countDocuments();
        const totalPages = Math.ceil(totalBrands/limit);
        const reverseBrand = brandData.reverse();
        res.render("brands",{
            data : reverseBrand,
            currentPage:page,
            totalPages:totalPages,
            totalBrands:totalBrands,
        })
        
    } catch (error) {
       res.redirect("/pageerror") 
    }
}


const addBrand = async (req,res)=>{
    try {
        const brand = req.body.name;
        const findBrand = await.findOne({brand});
        if(!findBrand){
            const image = req.file.filename;
            const newBrand = new Brand({
                brandName : brand,
                bransImage: image,,
            })
            await newBrand.save();
            res.redirect("/admin/brands");

        }
    } catch (error) {
        res.redirect("pageerror")
        
    }
}

const blockBrand = async (req,res)=>{
    try {
        const id = req.query.id;
        await Brand.updateOne({_id:id},{$set:{isBlocked:true}});
        res.redirect("/admin/brands")
    } catch (error) {
        
    }
}

const unblockBrand = async (req,res)=>{
    try {
        const id = req.query.id;
        await Brand.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect("/admin/brands")
        
    } catch ({error}) {
        res.redirect("/pageerror")
        
    }
}

const deleteBrand = async (req,res)=>{
    try {
        const {id} = req.query; // destructuring so efficirnt than above
        if(!id){
            return res.status(400).redirect("/pageerror")
        }
        await Brand.deleteOne({_id:id});
        res.redirect("/admin/brands")
    } catch (error) {
        console.error("Error deleting brand:",error);
        res.status(500).redirect("/pageerror")
    }
}


models.exports={
    getBrandPage,
    addBrand,
    blockBrand,
    unblockBrand,
    deleteBrand
}
 