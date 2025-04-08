const mongoose = require("mongoose");
const {Schema} = mongoose;


const productSchema = new Schema({
    productName: {
        type : String,
        required : true,
    },
    description: {
        type : String,
        required : true,
    },
    brand: {
        type : String,
        required : false,
    },
    category: {
        type : Schema.Types.ObjectId,
        ref : "Category",
        required : true
    },
    regularPrice: {
        type : Number,
        required : true,
    },
    salePrice: {
        type : Number,
        required : false,
    },
    productOffer: {
        type : Number,
        default : 0
    },
    quantity: {
        type : Number,
        default : 0
    },
    quantity : {
        type :  Number,
        required : true
    },
    color: {
        type : String,
        required : false,   
    },
    images:{
        type : [String],// multiple image so array
        required : true,
    },
    isListed: {
        type : Boolean,
        default : true
    },
    status: {
        type : String,
        enum : ["Available","out of stock","Discountinued"],
        required : true,
        default : "Available"
    }
},{timestamps : true});


const product = mongoose.model("Product",productSchema);
module.exports = product;
