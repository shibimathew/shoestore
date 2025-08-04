const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Product = require("../../models/productSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const crypto = require("crypto");

const placeOrder = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const {
      paymentMethod,
      selectedAddress,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    let { appliedCoupon, couponDiscount } = req.body;
    if (!couponDiscount) {
      let theCoupon = req.session.coupon;
      if (theCoupon) {
        couponDiscount = theCoupon.offerPrice;
        appliedCoupon = theCoupon._id;
      } else {
        couponDiscount = 0;
        appliedCoupon = null;
      }
    }

    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) {
      return res
        .status(400)
        .json({ success: false, message: "Address not found" });
    }

    const addressDetail = addressDoc.address.id(selectedAddress);
    if (!addressDetail) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid address selected" });
    }
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    // Stock validation before processing order
    const stockValidation = await validateStock(cart.items);
    if (!stockValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: "Some items in your cart are out of stock or have insufficient quantity",
        outOfStockItems: stockValidation.outOfStockItems,
        insufficientStockItems: stockValidation.insufficientStockItems
      });
    }

    const orderItems = cart.items.map((item) => ({
      product: item.productId._id,
      quantity: item.quantity,
      basePrice: item.basePrice,
      price: item.price,
      variant: { size: item.variants.size },
      productImage: item.productImage || item.productId.images[0],
      currentStatus: "Pending",
      statusHistory: [{ status: "Pending", timestamp: new Date() }],
    }));

    // Calculate order totals with coupon discount
    const subTotal = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const deliveryCharge = 41;
    const tax = parseFloat((subTotal * 0.05).toFixed(2));
    const discount = parseFloat(couponDiscount) || 0;
    const totalAmount = parseFloat(
      (subTotal + deliveryCharge + tax - discount).toFixed(2)
    );

    if (paymentMethod === "cod" && totalAmount > 1000) {
      return res.status(400).json({
        success: false,
        message:
          "COD is not possible for orders more than ₹1000. Please choose a different payment method.",
      });
    }

    let paymentStatus = "Pending";
    let paymentVerified = false;
    let paymentId = null;
    let orderStatus = "Pending";

    // Handle Razorpay payment verification
    if (paymentMethod === "razorpay") {
      if (razorpay_payment_id && razorpay_order_id && razorpay_signature) {
        // Verify payment signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
          .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
          .update(body.toString())
          .digest("hex");

        if (expectedSignature === razorpay_signature) {
          paymentStatus = "Paid";
          paymentVerified = true;
          paymentId = razorpay_payment_id;
          orderStatus = "Order Placed";

          // Update order items status
          orderItems.forEach((item) => {
            item.currentStatus = "Order Placed";
            item.statusHistory.push({
              status: "Order Placed",
              timestamp: new Date(),
            });
          });
        } else {
          paymentStatus = "Failed";
          orderStatus = "Payment Failed";

          // Update order items status
          orderItems.forEach((item) => {
            item.currentStatus = "Payment Failed";
            item.statusHistory.push({
              status: "Payment Failed",
              timestamp: new Date(),
            });
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Payment verification data missing",
        });
      }
    } else if (paymentMethod === "wallet") {
      // Handle wallet payment
      try {
        const walletTransactions = await Wallet.find({
          userId,
          entryType: "CREDIT",
        });
        const walletDebits = await Wallet.find({ userId, entryType: "DEBIT" });

        const totalCredits = walletTransactions.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        );
        const totalDebits = walletDebits.reduce(
          (sum, transaction) => sum + transaction.amount,
          0
        );
        const walletBalance = totalCredits - totalDebits;

        if (walletBalance < totalAmount) {
          return res.status(400).json({
            success: false,
            message: `Insufficient wallet balance. Available: ₹${walletBalance.toFixed(
              2
            )}, Required: ₹${totalAmount}`,
          });
        }

        // Create order first
        const order = await Order.create({
          orderId: "#SM" + Math.floor(Math.random() * 1e9).toString(),
          userId,
          orderItems: orderItems.map((item) => ({
            ...item,
            currentStatus: "Order Placed",
            statusHistory: [
              { status: "Pending", timestamp: new Date() },
              { status: "Order Placed", timestamp: new Date() },
            ],
          })),
          address: {
            addressDocId: addressDoc._id,
            addressDetailId: addressDetail._id,
          },
          paymentMethod,
          paymentStatus: "Paid",
          paymentVerified: true,
          paymentId: `wallet_${Date.now()}`,
          subTotal,
          deliveryCharge,
          tax,
          discount: discount,
          appliedCoupon: appliedCoupon || null,
          totalAmount,
          status: "Order Placed",
        });

        if (appliedCoupon) {
          await Coupon.findByIdAndUpdate(appliedCoupon, {
            $addToSet: { userId: userId },
          });
        }
        await Wallet.create({
          userId,
          address: {
            addressDocId: addressDoc._id,
            addressDetailId: addressDetail._id,
          },
          orderId: order._id,
          transactionId: `TXN_${Date.now()}_${Math.floor(
            Math.random() * 1000
          )}`,
          payment_type: "wallet",
          amount: totalAmount,
          status: "completed",
          entryType: "DEBIT",
          type: "product_purchase",
        });

        // Update inventory and clear cart
        for (const item of cart.items) {
          const productId = item.productId._id;
          const size = item.variants.size.toLowerCase();
          const quantity = item.quantity;

          await Product.findOneAndUpdate(
            { _id: productId },
            {
              $inc: {
                [`shoeSizes.${size}`]: -quantity,
              },
            }
          );

          const product = await Product.findById(productId);
          if (!product) continue;

          if (
            product.variant &&
            product.variant.size &&
            typeof product.variant.size[size] === "number"
          ) {
            product.variant.size[size] -= quantity;
            if (product.variant.size[size] < 0) {
              product.variant.size[size] = 0;
            }

            const allSizesZero = Object.values(product.variant.size).every(
              (qty) => qty === 0
            );
            if (allSizesZero) {
              product.status = "Out of stock";
            }

            await product.save();
          }
        }

        // Clear cart and coupon session after successful order
        await Cart.deleteOne({ userId });

        // Clear coupon from session after successful order
        req.session.coupon = null;
        req.session.discount = null;
        req.session.save();

        return res.json({ success: true, orderId: order.orderId });
      } catch (walletError) {
        console.error("Wallet payment error:", walletError);
        return res
          .status(500)
          .json({ success: false, message: "Wallet payment failed" });
      }
    } else if (paymentMethod === "cod") {
      paymentStatus = "Pending";
      orderStatus = "Order Placed";

      // Update order items status for COD
      orderItems.forEach((item) => {
        item.currentStatus = "Order Placed";
        item.statusHistory.push({
          status: "Order Placed",
          timestamp: new Date(),
        });
      });
    }

    // Create order for non-wallet payments (Razorpay and COD)
    if (paymentMethod !== "wallet") {
      const order = await Order.create({
        orderId: "#SM" + Math.floor(Math.random() * 1e9).toString(),
        userId,
        orderItems,
        address: {
          addressDocId: addressDoc._id,
          addressDetailId: addressDetail._id,
        },
        paymentMethod,
        paymentStatus,
        paymentVerified,
        paymentId,
        subTotal,
        deliveryCharge,
        tax,
        discount: discount,
        appliedCoupon: appliedCoupon || null,
        totalAmount,
        status: orderStatus,
      });

      // Only update inventory if payment is successful or COD
      if (paymentStatus === "Paid" || paymentMethod === "cod") {
        for (const item of cart.items) {
          const productId = item.productId._id;
          const size = item.variants.size.toLowerCase();
          const quantity = item.quantity;

          await Product.findOneAndUpdate(
            { _id: productId },
            {
              $inc: {
                [`shoeSizes.${size}`]: -quantity,
              },
            }
          );

          const product = await Product.findById(productId);
          if (!product) continue;

          if (
            product.variant &&
            product.variant.size &&
            typeof product.variant.size[size] === "number"
          ) {
            product.variant.size[size] -= quantity;
            if (product.variant.size[size] < 0) {
              product.variant.size[size] = 0;
            }

            const allSizesZero = Object.values(product.variant.size).every(
              (qty) => qty === 0
            );
            if (allSizesZero) {
              product.status = "Out of stock";
            }

            await product.save();
          }
        }

        if (appliedCoupon) {
          await Coupon.findByIdAndUpdate(appliedCoupon, {
            $addToSet: { userId: userId },
          });
        }

        // Clear cart and coupon session after successful order
        await Cart.deleteOne({ userId });

        // Clear coupon from session after successful order
        req.session.coupon = null;
        req.session.discount = null;
        req.session.save();
      }

      if (paymentStatus === "Failed") {
        return res.status(400).json({
          success: false,
          message: "Payment verification failed",
          orderId: order.orderId,
        });
      }

      res.json({ success: true, orderId: order.orderId });
    }
  } catch (err) {
    console.error("Error placing order:", err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// Stock validation function
const validateStock = async (cartItems) => {
  const outOfStockItems = [];
  const insufficientStockItems = [];

  for (const item of cartItems) {
    const product = item.productId;
    const requestedSize = item.variants.size.toLowerCase();
    const requestedQuantity = item.quantity;

    // Check if product exists and is available
    if (!product || product.status === "out of stock" || product.status === "Discountinued") {
      outOfStockItems.push({
        productName: product?.productName || 'Unknown Product',
        size: item.variants.size,
        reason: 'Product is out of stock or discontinued'
      });
      continue;
    }

    // Check stock for the specific size
    const availableStock = product.shoeSizes.get(requestedSize) || 0;
    
    if (availableStock === 0) {
      outOfStockItems.push({
        productName: product.productName,
        size: item.variants.size,
        reason: 'This size is out of stock'
      });
    } else if (availableStock < requestedQuantity) {
      insufficientStockItems.push({
        productName: product.productName,
        size: item.variants.size,
        requestedQuantity,
        availableStock,
        reason: `Only ${availableStock} items available in this size`
      });
    }
  }

  return {
    isValid: outOfStockItems.length === 0 && insufficientStockItems.length === 0,
    outOfStockItems,
    insufficientStockItems
  };
};

module.exports = {
  placeOrder,
};
