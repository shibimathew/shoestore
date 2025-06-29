const mongoose = require("mongoose");
const {Schema} = mongoose;


const categorySchema = new mongoose.Schema({
    categoryId : {
        type : String,
        required : true,
        unique : true
    },
    name: {
        type:String,
        required:true,
        unique:true

    },
    description: { 
        type:String,
        required:true,
    },
    isListed: {
        type:Boolean,
        required:true
    },
   
    categoryOffer: {
        type:Number,
    
        default: null,
    },
    createdAt: {
        type:Date,ll
        default:Date.now
    }
})

const Category = mongoose.model("Category",categorySchema);


module.exports = Category;