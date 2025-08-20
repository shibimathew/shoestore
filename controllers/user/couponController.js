const Coupon = require("../../models/couponSchema");
const applyCoupon = async (req, res) => {
  try {
    const { couponCode, subtotal } = req.body;
    const userId = req.user?._id || req.session?.user;
    const currentDate = new Date();

    if (!couponCode || !subtotal) {
      return res.json({ 
        success: false, 
        message: "Coupon code and order amount are required" 
      });
    }
  
    const coupon = await Coupon.findOne({
      code: { $regex: new RegExp(`^${couponCode}$`, 'i') },
      status: "Active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
    });

    if (!coupon) {
      return res.json({ 
        success: false, 
        message: "Invalid or expired coupon code" 
      });
    }

    // Check minimum order amount
    if (subtotal < coupon.minPrice) {
      return res.json({
        success: false,
        message: `Minimum order amount should be ₹${coupon.minPrice} to use this coupon`,
      });
    }

    // Enhanced single-use validation
    if (coupon.usageType === "single-use") {
      // Check if user has already used this coupon
      if (coupon.userId && coupon.userId.includes(userId)) {
        return res.json({ 
          success: false, 
          message: "This coupon can only be used once per customer. You have already used it." 
        });
      }
    }

    const discount = Math.min(coupon.offerPrice, subtotal);

 
    req.session.coupon = {
      _id: coupon._id,
      code: coupon.code,
      name: coupon.name,
      description: coupon.description,
      offerPrice: coupon.offerPrice,
      minPrice: coupon.minPrice,
      usageType: coupon.usageType,
      expiryDate: coupon.expiryDate,
    };
    req.session.discount = discount;

  
    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error saving coupon data" });
      }
      
      res.json({ 
        success: true, 
        coupon: {
          ...coupon.toObject(),
          usageType: coupon.usageType,
          usageInfo: coupon.usageType === 'single-use' 
            ? 'One-time use per customer' 
            : 'Can be used multiple times'
        }, 
        discount,
        message: `Coupon applied successfully! You saved ₹${discount.toFixed(2)}`
      });
    });
  } catch (error) {
    console.error("Apply coupon error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error applying coupon. Please try again." 
    });
  }
};


const clearCoupon = async (req, res) => {
  try {
    req.session.coupon = null;
    req.session.discount = null;

    req.session.save((err) => {
      if (err) {
        console.error("Session save error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Error clearing coupon data" });
      }

      res.json({ success: true, message: "Coupon cleared successfully" });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error clearing coupon" });
  }
};
const getCoupon = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user;
    const currentDate = new Date();

    // Get all active coupons
    const allCoupons = await Coupon.find({
      status: "Active",
      startDate: { $lte: currentDate },
      expiryDate: { $gte: currentDate },
    });

    // Filter coupons based on usage type and user history
    const availableCoupons = allCoupons.filter(coupon => {
      // Multi-use coupons are always available
      if (coupon.usageType === "multi-use") {
        return true;
      }
      
     
      if (coupon.usageType === "single-use") {
        return !coupon.userId || !coupon.userId.includes(userId);
      }
      
      return false;
    });

    // Enhance coupon data with additional information
    const enhancedCoupons = availableCoupons.map(coupon => {
      const couponObj = coupon.toObject();
      
      // Add usage information
      couponObj.usageInfo = coupon.usageType === 'single-use' 
        ? 'One-time use per customer' 
        : 'Can be used multiple times';
      
  
      couponObj.savingsPercentage = Math.round((coupon.offerPrice / coupon.minPrice) * 100);
      
      // Add days remaining
      const daysRemaining = Math.ceil((new Date(coupon.expiryDate) - currentDate) / (1000 * 60 * 60 * 24));
      couponObj.daysRemaining = daysRemaining;
      couponObj.expiryInfo = daysRemaining <= 7 
        ? `Expires in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` 
        : `Valid till ${new Date(coupon.expiryDate).toLocaleDateString()}`;
      
      return couponObj;
    });

    // Sort coupons by discount amount (highest first), then by expiry date
    enhancedCoupons.sort((a, b) => {
      if (b.offerPrice !== a.offerPrice) {
        return b.offerPrice - a.offerPrice;
      }
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });

    res.json({ 
      success: true, 
      coupons: enhancedCoupons,
      totalAvailable: enhancedCoupons.length,
      message: enhancedCoupons.length > 0 
        ? `${enhancedCoupons.length} coupon${enhancedCoupons.length !== 1 ? 's' : ''} available` 
        : 'No coupons available at the moment'
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching available coupons" 
    });
  }
};
module.exports={
    getCoupon,
    applyCoupon,
    clearCoupon
}