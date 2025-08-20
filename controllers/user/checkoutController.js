const Address = require("../../models/addressSchema");
const Cart = require("../../models/cartSchema");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Wallet = require("../../models/walletSchema");
const Coupon = require("../../models/couponSchema");
const Razorpay = require("razorpay");


const getCheckoutPage = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.session?.user;

    const addressDoc = await Address.findOne({ userId }).lean();
    const addresses = addressDoc?.address || [];
    

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        match: { isListed: { $ne: false } }, // not blocked by admin
      })
      .lean();
    const items = cart?.items?.filter((item) => item.productId !== null) || [];
    if (!items.length) {
      return res.redirect("/cart");
    }
    const subTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const delivery = 41;
    const tax = subTotal * 0.05;
    const total = subTotal + delivery + tax;

    res.render("user/checkout", {
      user: req.session?.user || req.user,
      addresses,
      items,
      total,
      coupon: req.session.coupon || null,
      discount: req.session.discount || null,
    });
  } catch (err) {
    next(err);
  }
};

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});



const getWalletBalance = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;

    const walletCredits = await Wallet.find({ userId, entryType: "CREDIT" });
    const walletDebits = await Wallet.find({ userId, entryType: "DEBIT" });

    const totalCredits = walletCredits.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const totalDebits = walletDebits.reduce(
      (sum, transaction) => sum + transaction.amount,
      0
    );
    const walletBalance = totalCredits - totalDebits;

    res.json({ success: true, balance: walletBalance });
  } catch (error) {
    console.error("Error fetching wallet balance:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch wallet balance" });
  }
};

const createRazorpayOrder = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const { couponDiscount } = req.body;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items.length) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    const subTotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const deliveryCharge = 41;
    const tax = parseFloat((subTotal * 0.05).toFixed(2));
    const discount = parseFloat(couponDiscount) || 0;
    const totalAmount = parseFloat(
      (subTotal + deliveryCharge + tax - discount).toFixed(2)
    );

    const options = {
      amount: Math.round(totalAmount * 100), // Amount in paise
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: {
        userId: userId.toString(),
        totalAmount: totalAmount.toString(),
        discount: discount.toString(),
      },
    };

    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create payment order" });
  }
};

const loadOrderSuccess = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const user = await User.findById(userId);

    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("orderItems.product")
      .populate("address.addressDocId");

      console.log('last order ===>',latestOrder, 'user id ==>', userId)

    if (!latestOrder) {
      return res.redirect("/orders?error=no-order-found");
    }

    let subtotal = 0;
    latestOrder.orderItems.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const deliveryCharge = latestOrder.deliveryCharge;
    const tax = latestOrder.tax;
    const totalAmount = parseFloat(
      (subtotal + deliveryCharge + tax).toFixed(2)
    );

    const addressDoc = latestOrder.address.addressDocId;
    const addressDetail = addressDoc.address.id(
      latestOrder.address.addressDetailId
    );

    if (!addressDetail) {
      return res.redirect("/orders?error=address-not-found");
    }

    res.render("user/orderSuccess", {
      order: latestOrder,
      email: user.email,
      orderItems: latestOrder.orderItems,
      address: addressDetail,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod: latestOrder.paymentMethod,
      paymentStatus: latestOrder.paymentStatus,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/pageNotFound");
  }
};

// Place this wherever your payment failure is handled:
const handleOrderPaymentFailure = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;

    // You must extract all required order data from cart/session
    // For brevity, assuming req.session.cart & req.session.selectedAddress exist
    const cart = req.session.cart; // Update as per your logic
    const address = req.session.selectedAddress; // Should have _id and addressSubdocId
    const paymentMethod = req.body.paymentMethod || "razorpay"; // or from where it is

    // Guard: Check if needed fields exist, else handle error/redirect

    // Calculate prices/amounts as per your checkout logic
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryCharge = 50; // Example, or calculate based on order
    const tax = parseFloat((0.18 * subtotal).toFixed(2)); // Example 18%
    const totalAmount = parseFloat((subtotal + deliveryCharge + tax).toFixed(2)); // final amount

    // Build orderItems as your schema needs
    const orderItems = cart.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price,
      basePrice: item.basePrice,
      currentStatus: "Payment Failed",
      variant: { size: item.size },
      productImage: item.productImage,
      statusHistory: [
        { status: "Payment Failed", timestamp: new Date() }
      ]
    }));

    // Build the order object
   

    // Redirect to failure page with order ID
 
  } catch (err) {
    console.error("Order saving failed", err);
    
  }
};


const loadOrderFailurePage = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const user = await User.findById(userId);

    const failAddress = await Address.findOne({ userId });
        if (!failAddress) {
          return res
            .status(400)
            .json({ success: false, message: "Address not found" });
        }
    
        const length = failAddress.address.length
        let index = Math.floor(length/2)
        if(index!==0 && index >= length){
          index--;
        }
        const failAddressDetail = failAddress.address[index]
        
    const cart = await Cart.findOne({ userId }).populate("items.productId");

      const orderItems = cart.items.map((item) => ({
      product: item.productId._id,
      quantity: item.quantity,
      basePrice: item.basePrice,
      price: item.price,
      variant: { size: item.variants.size },
      productImage: item.productImage || item.productId.images[0],
      currentStatus: "Payment Failed",
      statusHistory: [{ status: "Payment Failed", timestamp: new Date() }],
    }));
  

    const subTotal = orderItems.reduce(
      (sum, i) => sum + i.price * i.quantity,
      0
    );
    const failDeliveryCharge = 41;
    const failTax = parseFloat((subTotal * 0.05).toFixed(2));
    // const discount = parseFloat(couponDiscount) || 0;
    const failTotal = parseFloat(
      (subTotal + failDeliveryCharge + failTax - 0).toFixed(2)
    );
   

     const orderData = {
      userId,
      orderItems,
      address: {
        addressDocId: failAddress._id,
        addressDetailId: failAddressDetail._id, // make sure you save the subdocument's _id at address select
      },
      paymentMethod: "razorpay",
      paymentStatus: "Failed",
      paymentVerified: false,
      failureReason: "Payment gateway error", // Update with real reason if available
      deliveryCharge : failDeliveryCharge,
      tax : failTax,
      totalAmount : failTotal,
      status: "Payment Failed",
    };

    const failedOrder = new Order(orderData);
    await failedOrder.save();

    const latestOrder = await Order.findOne({ userId })
      .sort({ createdAt: -1 })
      .populate("orderItems.product")
      .populate("address.addressDocId");

    if (!latestOrder) {
      return res.redirect("/orders?error=no-order-found");
    }

    let subtotal = 0;
    latestOrder.orderItems.forEach((item) => {
      subtotal += item.price * item.quantity;
    });

    const deliveryCharge = latestOrder.deliveryCharge;
    const tax = latestOrder.tax;
    const totalAmount = parseFloat(
      (subtotal + deliveryCharge + tax).toFixed(2)
    );

    const addressDoc = latestOrder.address.addressDocId;
    const addressDetail = addressDoc.address.id(
      latestOrder.address.addressDetailId
    );

    if (!addressDetail) {
      return res.redirect("/orders?error=address-not-found");
    }


    res.render("user/orderFailure", {
      order: latestOrder,
      email: user.email,
      orderItems: latestOrder.orderItems,
      address: addressDetail,
      subtotal,
      deliveryCharge,
      tax,
      totalAmount,
      paymentMethod: latestOrder.paymentMethod,
      paymentStatus: latestOrder.paymentStatus,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/pageNotFound");
  }
};



// Stock validation function for frontend
const checkStockAvailability = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || !cart.items.length) {
      return res.json({ 
        success: true, 
        isValid: true, 
        message: "Cart is empty" 
      });
    }

    const outOfStockItems = [];
    const insufficientStockItems = [];

    for (const item of cart.items) {
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

    const isValid = outOfStockItems.length === 0 && insufficientStockItems.length === 0;

    res.json({
      success: true,
      isValid,
      outOfStockItems,
      insufficientStockItems,
      message: isValid 
        ? "All items are in stock" 
        : "Some items have stock issues"
    });

  } catch (error) {
    console.error("Error checking stock availability:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error checking stock availability" 
    });
  }
};

module.exports = {
  getCheckoutPage,
  loadOrderSuccess,
  loadOrderFailurePage,
  createRazorpayOrder,
  getWalletBalance,
  checkStockAvailability,
};
