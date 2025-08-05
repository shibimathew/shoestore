const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    address: {
        addressDocId: { type: Schema.Types.ObjectId, ref: 'Address'},
        addressDetailId: { type: Schema.Types.ObjectId }
    },  
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
    },    
    transactionId : {
        type : String,
        // required : true
    },
    payment_type: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        default: 'pending'
    },
    entryType : {
        type : String,
        enum : ['CREDIT','DEBIT'],
        required: true
    },
    type: {
        type: String,
        enum: ['add_money', 'product_purchase', 'refund', 'cancel','referral','item_refund'],
        required: true
    },
},{timestamps : true});


const Wallet = mongoose.model("Wallet", walletSchema)

module.exports = Wallet;