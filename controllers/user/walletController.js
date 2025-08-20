const mongoose = require("mongoose");
const Wallet = require("../../models/walletSchema");
const Cart = require("../../models/cartSchema");
const Wishlist = require("../../models/wishlistSchema");
const User = require("../../models/userSchema");

const getMyWalletPage = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.session?.user;

    if (!userId) {
      return res.redirect("/login");
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.redirect("/login");
    }

    const transactions = await Wallet.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Use user.wallet field as primary balance, but verify with transactions if needed
    let balance = user.wallet || 0;

    // Optional: Verify balance matches transaction history (for debugging)
    let calculatedBalance = 0;
    transactions.forEach(transaction => {
      if (transaction.entryType === 'CREDIT') {
        calculatedBalance += transaction.amount;
      } else if (transaction.entryType === 'DEBIT') {
        calculatedBalance -= transaction.amount;
      }
    });

    
    
    // If there's a mismatch, you might want to sync them
    if (Math.abs(balance - calculatedBalance) > 0.01) {
      console.warn("Balance mismatch detected - consider syncing");
    }

    let cart = await Cart.findOne({ userId }).populate("items.productId");
    const items = cart?.items || [];

    let wishlistCount = 0;
    if (userId) {
      const wishlist = await Wishlist.findOne({ userId });
      wishlistCount = wishlist ? wishlist.products.length : 0;
    }

    res.render("user/myWallet", {
      balance,
      transactions,
      user,
      items,
      wishlistCount,
    });
  } catch (error) {
    console.error("Error rendering wallet page:", error);
    next(error);
  }
};

const getWalletTransactions = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated" });
    }

    const transactions = await Wallet.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("Error fetching wallet transactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const refundMoney = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, error: "User not authenticated" });
    }

    const { amount, orderId, transactionId, payment_type, address } = req.body;

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: "Invalid amount" });
    }

    // Prepare wallet transaction data
    const walletData = {
      userId,
      amount,
      payment_type,
      entryType: "CREDIT",
      type: "refund",
      status: "completed",
    };

    // Add optional fields if provided
    if (orderId) walletData.orderId = orderId;
    if (transactionId) walletData.transactionId = transactionId;
    if (address) walletData.address = address;

    // Create the wallet transaction
    const txn = await Wallet.create(walletData);

    // Update user's wallet balance
    await User.findByIdAndUpdate(userId, {
      $inc: { wallet: amount },
      $push: {
        walletHistory: {
          type: "credit",
          amount: amount,
          description: `Refund${orderId ? ` for order #${orderId}` : ''}`,
          timestamp: new Date(),
        },
      },
    });

    res.json({ success: true, transaction: txn });
  } catch (error) {
    console.error("Error refunding money:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getMyWalletPage,
  getWalletTransactions,
  refundMoney,
};


