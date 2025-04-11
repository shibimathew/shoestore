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
    longDescription: {
        type : String,
        required : false,
    },
    specifications: {
        type : String,
        required : false,
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
        required : true,
        default : 0
    },
    color: {
        type : String,
        required : false,   
    },
    shoeSizes: {
        type: Map,
        of: Number,
        default: function() {
            const sizes = {};
            for (let i = 1; i <= 10; i++) {
                sizes[i] = 0;
            }
            return sizes;
        }
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
