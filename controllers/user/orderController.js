const mongoose = require("mongoose");
const Order = require("../../models/orderSchema");
const User = require("../../models/userSchema");
const Refund = require("../../models/refundSchema");
const Wallet = require("../../models/walletSchema");
const Product = require("../../models/productSchema");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

const getMyOrdersPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);

    const page = parseInt(req.query.page) || 1;
    const limit = 5;
    const skip = (page - 1) * limit;

    // Include all orders including failed payments
    const totalOrders = await Order.countDocuments({ userId: user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    const orders = await Order.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("orderItems.product")
      .populate("address.addressDocId")
      .populate("appliedCoupon");

    res.render("user/myOrders", {
      orders,
      user,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error("Error in getMyOrdersPage:", error);
    res.redirect("/admin/pageerror");
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const user = await User.findById(req.session.user);
    const id = req.params.id;

    const order = await Order.findById(id)
      .populate("userId")
      .populate("orderItems.product")
      .populate("address.addressDocId")
      .populate("address.addressDetailId")
      .populate("appliedCoupon");

    if (!order) {
      return res.status(404).render("notFound");
    }

    order.statusHistory = Array.isArray(order.statusHistory)
      ? order.statusHistory
      : [];

    res.render("user/orderDetails", { order, user });
  } catch (error) {
    console.error("Error in getOrderDetails:", error);
    res.redirect("/admin/pageerror");
  }
};

const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { cancelReason } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).render("notFound");
    }

    order.status = "Cancelled";
    order.cancelReason = cancelReason;
    order.statusHistory = order.statusHistory || [];
    order.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      reason: cancelReason,
    });
    await order.save();

    for (let item of order.orderItems) {
      const size = item.variant.size;
      const productId = item.product;
      const quantity = item.quantity;
      await Product.findOneAndUpdate(
        { _id: productId },
        {
          $inc: {
            [`shoeSizes.${size}`]: quantity,
          },
        }
      );
    }
    const paymentMethod = (order.paymentMethod || "").toLowerCase();
    if (paymentMethod !== "cod" && order.paymentStatus === "Paid") {
      const userId = order.userId;
      const refundAmount = order.totalAmount || order.walletAmountUsed || 0;

      await new Wallet({
        userId: userId,
        transactionId: `REFUND-${Date.now()}`,
        payment_type: "refund",
        amount: refundAmount,
        status: "completed",
        entryType: "CREDIT",
        type: "refund",
        orderId: order._id,
      }).save();

      await User.findByIdAndUpdate(userId, {
        $inc: { wallet: refundAmount },
        $push: {
          walletHistory: {
            type: "credit",
            amount: refundAmount,
            description: `Refund for cancelled order #${order._id}`,
          },
        },
      });
    }

    // res.redirect(`/user/orderDetails/${orderId}`);
    res.redirect(`/orderDetails/${order._id}`);
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.redirect("/admin/pageerror");
  }
};
const cancelIndividualItem = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const itemId = req.params.itemId;
    const { cancelReason } = req.body;

    const order = await Order.findById(orderId).populate("orderItems.product");
    if (!order) {
      return res.status(404).render("notFound");
    }

    // Find the specific item to cancel
    const itemToCancel = order.orderItems.find(
      (item) => item._id.toString() === itemId
    );
    if (!itemToCancel) {
      return res.status(404).json({ message: "Item not found" });
    }

    // Check if item can be cancelled (only if not already cancelled/returned)
    if (
      itemToCancel.currentStatus === "Cancelled" ||
      itemToCancel.currentStatus === "Returned" ||
      itemToCancel.currentStatus === "Return Requested"
    ) {
      return res.status(400).json({ message: "Item cannot be cancelled" });
    }

    // Update the specific item status
    itemToCancel.currentStatus = "Cancelled";
    itemToCancel.cancelReason = cancelReason;

    // Initialize statusHistory if it doesn't exist
    if (!itemToCancel.statusHistory) {
      itemToCancel.statusHistory = [];
    }

    // Add cancellation to item's status history
    itemToCancel.statusHistory.push({
      status: "Cancelled",
      timestamp: new Date(),
      reason: cancelReason,
    });

    // Restore stock for the cancelled item
    const size = itemToCancel.variant.size;
    const productId = itemToCancel.product._id || itemToCancel.product;
    const quantity = itemToCancel.quantity;

    await Product.findOneAndUpdate(
      { _id: productId },
      {
        $inc: {
          [`shoeSizes.${size}`]: quantity,
        },
      }
    );

    // Handle refund for individual item if payment was made online
    const paymentMethod = (order.paymentMethod || "").toLowerCase();
    if (paymentMethod !== "cod" && order.paymentStatus === "Paid") {
      const userId = order.userId;

      // Calculate refund amount for this specific item
      const itemPrice =
        itemToCancel.product.salePrice || itemToCancel.price || 0;
      const itemTotal = itemPrice * itemToCancel.quantity;

      // Calculate proportional delivery charge and tax if applicable
      const orderSubtotal = order.subTotal || 0;
      const proportionalDeliveryCharge =
        orderSubtotal > 0
          ? (itemTotal / orderSubtotal) * (order.deliveryCharge || 0)
          : 0;
      const proportionalTax =
        orderSubtotal > 0 ? (itemTotal / orderSubtotal) * (order.tax || 0) : 0;

      const refundAmount =
        itemTotal + proportionalDeliveryCharge + proportionalTax;

      // Create wallet entry for refund
      await new Wallet({
        userId: userId,
        transactionId: `ITEM-REFUND-${Date.now()}`,
        payment_type: "refund",
        amount: refundAmount,
        status: "completed",
        entryType: "CREDIT",
        type: "item_refund",
        orderId: order._id,
        itemId: itemToCancel._id,
      }).save();

      // Update user wallet
      await User.findByIdAndUpdate(userId, {
        $inc: { wallet: refundAmount },
        $push: {
          walletHistory: {
            type: "credit",
            amount: refundAmount,
            description: `Refund for cancelled item: ${
              itemToCancel.product?.productName || "Item"
            } from order #${order._id}`,
          },
        },
      });
    }

    // Check if all items are cancelled to update order status
    const allItemsCancelled = order.orderItems.every(
      (item) =>
        item.currentStatus === "Cancelled" || item.currentStatus === "Returned"
    );

    if (allItemsCancelled) {
      order.status = "Cancelled";
      order.cancelReason = "All items cancelled";

      if (!order.statusHistory) {
        order.statusHistory = [];
      }

      order.statusHistory.push({
        status: "Cancelled",
        timestamp: new Date(),
        reason: "All items cancelled individually",
      });
    }
  

    await order.save();

    res.redirect(`/orderDetails/${orderId}`);
  } catch (error) {
    console.error("Error cancelling individual item:", error);
    res
      .status(500)
      .json({ message: "Error cancelling item", error: error.message });
  }
};

const returnFullOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { returnReason, otherReason } = req.body;

    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
      return res.status(404).render("notFound");
    }

    const reason = returnReason === "Other" ? otherReason : returnReason;

    for (const item of order.orderItems) {
      item.currentStatus = "Return Requested";
      item.cancelReason = reason;
      const size = item.variant.size;
      const productId = item.product;
      const quantity = item.quantity;

      await Product.findOneAndUpdate(
        { _id: productId },
        {
          $inc: {
            [`shoeSizes.${size}`]: quantity,
          },
        }
      );
      if (!item.statusHistory) item.statusHistory = [];

      item.statusHistory.push({
        status: "Return Requested",
        timestamp: new Date(),
      });

      await new Refund({
        order: order._id,
        itemId: item._id,
        product: item.product._id,
        userId: order.userId,
        reason: reason,
        status: "Requested",
        variantSize: item.variant?.size || "N/A",
      }).save();
    }

    order.status = "Return Requested";
    order.cancelReason = reason;
    await order.save();

    res.redirect(`/orderDetails/${orderId}`);
  } catch (error) {
    console.error("Error in returnFullOrder:", error);
    res.redirect("/admin/pageerror");
  }
};

const returnSelectedItems = async (req, res) => {
  try {
    const orderId = req.params.id;
    const { returnItems, returnReason, otherReason } = req.body;

    const order = await Order.findById(orderId).populate("orderItems.product");

    if (!order) {
      return res.status(404).render("notFound");
    }

    if (!returnItems || returnItems.length === 0) {
      return res.redirect(`/orderDetails/${orderId}`);
    }

    const reason = returnReason === "Other" ? otherReason : returnReason;

    for (const item of order.orderItems) {
      if (returnItems.includes(item._id.toString())) {
        item.currentStatus = "Return Requested";
        item.cancelReason = reason;

        if (!item.statusHistory) item.statusHistory = [];

        item.statusHistory.push({
          status: "Return Requested",
          timestamp: new Date(),
        });

        const size = item.variant.size;
        const quantity = item.quantity;
        const productId = item.product;
        await Product.findOneAndUpdate(
          { _id: productId },
          {
            $inc: {
              [`shoeSizes.${size}`]: quantity,
            },
          }
        );

        await new Refund({
          order: order._id,
          itemId: item._id,
          product: item.product._id,
          userId: order.userId,
          reason: reason,
          status: "Requested",
          variantSize: item.variant?.size || "N/A",
        }).save();
      }
    }

    order.status = "Return Requested";
    order.cancelReason = reason;
    await order.save();

    res.redirect(`/orderDetails/${orderId}`);
  } catch (error) {
    console.error("Error in returnSelectedItems:", error);
    res.redirect("/admin/pageerror");
  }
};

const generateInvoice = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId)
      .populate("userId")
      .populate("orderItems.product")
      .populate("address.addressDocId");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create a new PDF document
    const doc = new PDFDocument();
    const fileName = `invoice-${order.orderId || orderId}.pdf`;

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);

    // Pipe the PDF directly to the response
    doc.pipe(res);

    // Add company logo and header
    doc.fontSize(20).text("ShoeStore", { align: "center" });
    doc.moveDown();
    doc.fontSize(16).text("Invoice", { align: "center" });
    doc.moveDown();

    // Add order details
    doc.fontSize(12).text(`Order Number: #${order.orderId || orderId}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`);
    doc.text(`Payment Method: ${order.paymentMethod || "N/A"}`);
    doc.text(`Payment Status: ${order.paymentStatus || "N/A"}`);
    doc.moveDown();

    // Add customer details
    doc.fontSize(14).text("Customer Details");
    doc.fontSize(12).text(`Name: ${order.userId?.name || "N/A"}`);
    doc.text(`Email: ${order.userId?.email || "N/A"}`);
    doc.moveDown();

    // Add shipping address
    if (order.address?.addressDocId) {
      const address = order.address.addressDocId.address[0];
      doc.fontSize(14).text("Shipping Address");
      doc.fontSize(12).text(`${address.name}`);
      // doc.text(`${order.address.addressDocId.address}`);
      doc.text(`${address.addressLine1}`);
      doc.text(`${address.addressLine2}`);
      doc.text(`${address.addressType}`);
      doc.text(`${address.city}, ${address.state} ${address.pincode}`);
      doc.text(`Phone: ${address.phone}`);
      doc.moveDown();
    }
    // Add order items
    doc.fontSize(14).text("Order Items");
    doc.moveDown();

    const tableTop = doc.y;
    doc
      .fontSize(12)
      .text("Item", 50, tableTop)
      .text("Size", 250, tableTop)
      .text("Qty", 350, tableTop)
      .text("Price", 400, tableTop)
      .text("Total", 480, tableTop);

    doc.moveDown();
    let yPos = doc.y;

    if (Array.isArray(order.orderItems)) {
      order.orderItems.forEach((item) => {
        const productName = item.product?.productName || "N/A";
        const size = item.variant?.size || "N/A";
        const quantity = item.quantity || 0;
        const price = item.price || 0;
        const total = price * quantity || 0;

        doc
          .text(productName, 50, yPos)
          .text(size.toUpperCase(), 250, yPos)
          .text(quantity.toString(), 350, yPos)
          .text(`₹${price.toFixed(2)}`, 400, yPos)
          .text(`₹${total.toFixed(2)}`, 480, yPos);
        yPos += 20;
      });
    }

    doc.moveDown();
    yPos += 20;

    const subtotal = order.totalAmount || 0;
    const shippingCharge = order.shippingCharge || 0;
    const couponDiscount = order.couponDiscount || 0;
    const total = subtotal + shippingCharge - couponDiscount || 0;
    doc
      .fontSize(12)
      .text("Subtotal:", 350, yPos)
      .text(`₹${subtotal.toFixed(2)}`, 480, yPos);
    yPos += 20;

    doc
      .text("Shipping:", 350, yPos)
      .text(`₹${shippingCharge.toFixed(2)}`, 480, yPos);
    yPos += 20;

    if (order.couponDiscount > 0) {
      doc
        .text("Discount:", 350, yPos)
        .text(`-₹${couponDiscount.toFixed(2)}`, 480, yPos);
      yPos += 20;
    }

    doc
      .fontSize(14)
      .text("Total:", 350, yPos)
      .text(`₹${total.toFixed(2)}`, 480, yPos);

    doc
      .fontSize(10)
      .text("Thank you for shopping with us!", 50, doc.page.height - 50, {
        align: "center",
      });

    doc.end();
  } catch (error) {
    console.error("Error generating invoice:", error);
    res
      .status(500)
      .json({ message: "Error generating invoice", error: error.message });
  }
};

module.exports = {
  getMyOrdersPage,
  getOrderDetails,
  cancelOrder,
  cancelIndividualItem,
  returnFullOrder,
  returnSelectedItems,
  generateInvoice,
};
