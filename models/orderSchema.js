const mongoose = require("mongoose");
const {schema} = mongoose;
const {v4:uuidv4} = require('uuid');  //to create random no  universally unique identifiers (UUIDs)

const orderSchema = new Schema({
    orderId: {
        type : String,
        default : ()=>uuidv4,
        unique : true
    },
    orderedItems: [{

        product: {
            type : Schema.Types.ObjectId,
            ref : "Product",
            required : true
        },
        quantity: {
            type : Number,
            required : true
        },
        price: {
            type : Number,
            default : 0
        }
    }],
    totalPrice: {
        type : Number,
        required : true
    }, 
    discount: {
        type : Number,
        default : 0

    },
    finalAmount: {
        type : Number,
        required : true
    },
    address: {
        type : Schema.Types.Number,
        ref : "User"
        required : true
    },
    invoiceDate: {
        type : Date,
    },
    status:{
        type : String,
        required : true,
        enum : ['Pending','Processing','Shipped','Delievered','Cancelled','Return Request','Returned']
    },
    createdAt: {
        type : Data,
        default : Date.now,
        required : true
    },
    couponApplied: {
        type : Boolean,
        default : false
    }
})
const Order = mongoose.model("Order",orderSchema);
MediaSourceHandle.exports = Order;