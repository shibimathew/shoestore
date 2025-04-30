const { get } = require("mongoose");
const Category = require("../../models/categorySchema")
const {nanoid} = require("nanoid")

const categoryInfo =  async (req,res)=>{
    try {
        const page = parseInt(req.query.page)||1;// parsing the url
        const limit = 4;
        const skip = (page-1)*limit;
        const filter = {}
        const searchQuery = req.query.searchQuery;
        
        if(searchQuery){
            const searchRegex = new RegExp(searchQuery,"i")
            filter.name = searchRegex;
        }

        const categoryData  = await Category.find(filter)
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
    try {
        const {name, description, isListed} = req.body;
        
        // Validate required fields
        if (!name || !description) {
            return res.status(400).json({error: "Name and description are required"});
        }

      
        const existingCategory = await Category.findOne({name: name.trim()});
        if(existingCategory){
            return res.status(400).json({error: "Category already exists"});
        }

        const generateCategoryId = () => {
            return `CAT-${nanoid(10)}`;
          };

          const categoryId = generateCategoryId()

        const newCategory = new Category({
            categoryId : categoryId,
            name: name.trim(),
            description: description.trim(),
            isListed: isListed === "true" || isListed === true,
            
        });

  
        await newCategory.save();//saving the category
        
        return res.status(201).json({
            success: true,
            message: "Category added successfully",
            category: newCategory
        });

    } catch (error) {
        console.error("Error in addCategory:", error);
        return res.status(500).json({
            error: "An error occurred while adding the category",
            details: error.message
        });
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

const loadEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById(categoryId);
        const categories = await Category.find({ _id: { $ne: categoryId } });

        if (!category) {
            return res.redirect('/admin/category');
        }

        res.render('admin/editCategory', {
            category,
            cat: categories
        });
    } catch (error) {
        console.error("Error in loadEditCategory:", error);
        res.redirect('/admin/pageerror');
    }
}

const editCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { categoryName, description, } = req.body;

        // Validate required fields
        if (!categoryName || !description) {
            return res.status(400).json({ error: "Name and description are required" });
        }

       
        const existingCategory = await Category.findOne({
            name: categoryName.trim(),
            _id: { $ne: categoryId }
        });

        if (existingCategory) {
            return res.status(400).json({ error: "Category name already exists" });
        }

      
        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            {
                name: categoryName.trim(),
                description: description.trim(),
                
            },
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ error: "Category not found" });
        }

        return res.json({
            success: true,
            message: "Category updated successfully",
            category: updatedCategory
        });

    } catch (error) {
        console.error("Error in editCategory:", error);
        return res.status(500).json({
            error: "An error occurred while updating the category",
            details: error.message
        });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const categoryId = req.query.id;
        
        const category = await Category.findById(categoryId);
        if (!category) {
            if (req.xhr || req.headers.accept.indexOf('json') > -1) {
                return res.status(404).json({ error: "Category not found" });
            }
            return res.redirect('/admin/category');
        }

        // Deleting the category
        await Category.findByIdAndDelete(categoryId);
        
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.json({
                success: true,
                message: "Category deleted successfully"
            });
        }
        
        return res.redirect('/admin/category');

    } catch (error) {
        console.error("Error in deleteCategory:", error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({
                error: "An error occurred while deleting the category",
                details: error.message
            });
        }
        return res.redirect('/admin/pageerror');
    }
}

module.exports = {
    categoryInfo,
    addCategory,
    getListCategory,
    getUnlistCategory,
    loadEditCategory,
    editCategory,
    deleteCategory
}