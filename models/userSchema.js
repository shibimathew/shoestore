const mongoose = require("mongoose");
const {Schema} = mongoose;


const userSchema = new Schema({
    name: {
        type : String,
        required : true
    },
    profileImage : {
        type : String,
        required : false
    },
    email: {
        type : String,
        required : true,
        unique : true

    },
    phone: {//single signup will be there using google so userid and name only will be there
        type : String,
        required : false,
        unique : false,
        sparse : true,// to set unique constrains since phone no is not there
        default : null
    },
    gender:{
        type : String,
        required : false
    },
    googleId: {
        type : String,
        unique : true,
        sparse : true
    },
    password: {
        type : String,
        required : false
    },
    isBlocked: {
        type: Boolean,
        default : false
    },
    isAdmin: {
        type : Boolean,
        default : false
    },//multiple products so array
    cart: [{
        type : Schema.Types.ObjectId,
        ref:"Cart"
    }],
    wallet: {
        type : Number,
        default : 0
    },
    wishlist: [{
        type : Schema.Types.ObjectId,
        ref : "Wishlist"
    }],
    orderHistory: [{
        type : Schema.Types.ObjectId
        // ref : "Order"
    }],
    createAt: {
        type : Date,
        default : Date.now,
    },
    referralCode: {
        type : String,
        // required : true
    },
    redeemed: {
        type : Boolean,
        // default : false
    },
    redemmedUsers: [{
        type : Schema.Types.ObjectId,
        ref : "User"
        // required : true
    }],
    searchHistory: [{
        category: {
            type : Schema.Types.ObjectId,
            ref : "category"
        },
        brand: {
            type : String
        },
        searchOn: {
            type : Date,
            default : Date.now
        }
    }]
})



const User = mongoose.model("User",userSchema);

module.exports = User;