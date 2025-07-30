// const Address = require("../../models/addressSchema");
// const Cart = require("../../models/cartSchema");
// const Order = require("../../models/orderSchema");
// const User = require("../../models/userSchema");
// const Product = require("../../models/productSchema");
// const Wallet = require("../../models/walletSchema");
// const Coupon = require("../../models/couponSchema");
// const mongoose = require("mongoose");
// const Razorpay = require("razorpay");
// const crypto = require("crypto");
// const returnFullOrder = async (req, res) => {
//     try {
//       const orderId = req.params.id;
//       const { returnReason, otherReason } = req.body;
  
//       const order = await Order.findById(orderId).populate('orderItems.product');
  
//       if (!order) {
//         return res.status(404).render('notFound');
//       }
  
//       const reason = returnReason === 'Other' ? otherReason : returnReason;
  
//       for (const item of order.orderItems) {
//         item.currentStatus = 'Return Requested';
//         item.cancelReason = reason;
//         const size = item.variant.size
//         const productId = item.product
//         const quantity = item.quantity

//         await Product.findOneAndUpdate({_id:productId},{
//           $inc:{
//             [`shoeSizes.${size}`]:quantity
//           }
//         })
//         if (!item.statusHistory) item.statusHistory = [];
  
//         item.statusHistory.push({
//           status: 'Return Requested',
//           timestamp: new Date()
//         });
  
//         await new Refund({
//           order: order._id,
//           itemId: item._id, 
//           product: item.product._id,
//           userId: order.userId,
//           reason: reason,
//           status: 'Requested',
//           variantSize: item.variant?.size || 'N/A'
//         }).save();
//       }
  
//       order.status = 'Return Requested';
//       order.cancelReason = reason;
//       await order.save();
  
//       res.redirect(`/orderDetails/${orderId}`);
//     } catch (error) {
//       console.error('Error in returnFullOrder:', error);
//       res.redirect('/admin/pageerror');
//     }
//   };
  

//   const returnSelectedItems = async (req, res) => {
//     try {
//       const orderId = req.params.id;
//       const { returnItems, returnReason, otherReason } = req.body;

//       const order = await Order.findById(orderId).populate('orderItems.product');
  
//       if (!order) {
//         return res.status(404).render('notFound');
//       }
  
//       if (!returnItems || returnItems.length === 0) {
//         return res.redirect(`/orderDetails/${orderId}`);
//       }
  
//       const reason = returnReason === 'Other' ? otherReason : returnReason;
  
//       for (const item of order.orderItems) {
//         if (returnItems.includes(item._id.toString())) {
//           item.currentStatus = 'Return Requested';
//           item.cancelReason = reason;
  
//           if (!item.statusHistory) item.statusHistory = [];
  
//           item.statusHistory.push({
//             status: 'Return Requested',
//             timestamp: new Date()
//           });


//           const size= item.variant.size
//           const quantity = item.quantity
//           const productId = item.product
//           await Product.findOneAndUpdate({_id:productId},{
//             $inc:{
//               [`shoeSizes.${size}`]:quantity
//             }
//           })

  
//           await new Refund({
//             order: order._id,
//             itemId: item._id, 
//             product: item.product._id,
//             userId: order.userId,
//             reason: reason,
//             status: 'Requested',
//             variantSize: item.variant?.size || 'N/A'
//           }).save();
//         }
//       }
  
//       order.status = 'Return Requested';
//       order.cancelReason = reason;
//       await order.save();

      
  
//       res.redirect(`/orderDetails/${orderId}`);
//     } catch (error) {
//       console.error('Error in returnSelectedItems:', error);
//       res.redirect('/admin/pageerror');
//     }
//   };
//   module.exports = {
//     returnFullOrder,
//     returnSelectedItems,}