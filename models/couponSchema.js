const mongoose = require('mongoose');
const {Schema} = mongoose;


const couponSchema = new mongoose.Schema({
    name: {
        type : String,
        required : true,
        unique : true
    },
    CreatedAt: {
        type : Date,
        default : Date.now,
        required : true
    },
    expireAt: {
        type : Date,
        required : true
    },
    offeraPrice: {
        type : Number,
        required : true
    },
    minimumPrice:{
        type : Number,
        required : true
    },
    isList: {
        type : Boolean,
        default : true
    }, 
    userId: [{
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'
    }]
})
 
const Coupon = mongoose.model("Coupon",couponSchema);
module.exports = Coupon;






