const User = require("../../models/userSchema");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Order = require('../../models/orderSchema');
const Product = require('../../models/productSchema');
const Category = require('../../models/categorySchema');
const moment = require("moment");

const pageerror = async (req,res)=>{
    res.render("admin/pageerror")
}

const loadLogin = (req, res) => {
    if (req.session.admin) {
        return res.redirect("/admin/dashboard");
    }
    res.render("admin/login", { message: null }); }

const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await User.findOne({ email, isAdmin: true });

        if (admin) {
            const passwordMatch =  await bcrypt.compare(password, admin.password); 
            if (passwordMatch) {
                req.session.admin = admin;
                return res.redirect("/admin/dashboard"); 
            }
        }else{
            return res.redirect("/login"); 
        }
    } catch (error) {
        console.log("Login error:", error);
        return res.redirect("/admin/pageerror");
    }
};


const getDateRanges = () => {
    const now = new Date();

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay() + 1); // Monday
    startOfWeek.setHours(0, 0, 0, 0);
  
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);
  
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    endOfYear.setHours(23, 59, 59, 999);
  
    return {
      weekly: { start: startOfWeek, end: endOfWeek },
      monthly: { start: startOfMonth, end: endOfMonth },
      yearly: { start: startOfYear, end: endOfYear },
    };
  };
  
  // to calculate stats for a specific time period
  const calculatePeriodStats = async (startDate, endDate) => {
    try {
      // Revenue for the period - Fixed status matching
      const revenueData = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Order Placed",
                "Order Confirmed", 
                "Order Shipped",
                "Delivered",
              ],
            },
            createdAt: { $gte: startDate, $lte: endDate },
          },
        },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]);
      const revenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;
  
      // Orders for the period
      const orders = await Order.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
      });
  
      // Products and categories ( don't change by time period)
      const products = await Product.countDocuments();
      const categories = await Category.countDocuments();
  
      return {
        revenue: revenue,
        orders: orders,
        products: products,
        categories: categories,
      };
    } catch (error) {
      console.error("Error calculating period stats:", error);
      return {
        revenue: 0,
        orders: 0,
        products: 0,
        categories: 0,
      };
    }
  };


const getBestSellingCategoriesForPeriod = async (startDate, endDate) => {
  try {
    console.log(`Fetching categories for period: ${startDate} to ${endDate}`);
    
    const categories = await Order.aggregate([
      {
        $match: {
          status: {
            $in: [
              "Order Placed",
              "Order Confirmed", 
              "Order Shipped",
              "Delivered",
            ],
          },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "categories",
          localField: "productDetails.category",
          foreignField: "_id", 
          as: "categoryDetails",
        },
      },
      { $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: "$categoryDetails._id",
          categoryName: { $first: "$categoryDetails.name" },
          totalSales: {
            $sum: {
              $multiply: ["$orderItems.quantity", "$orderItems.price"],
            },
          },
          totalQuantity: { $sum: "$orderItems.quantity" },
        },
      },
      { $match: { _id: { $ne: null } } }, // Filter out null categories
      { $sort: { totalSales: -1 } },
      { $limit: 10 },
    ]);

    console.log(`Found ${categories.length} categories for period`);
  
    const result = {
      labels: categories.length > 0 ? categories.map(cat => cat.categoryName || 'Unknown') : [],
      data: categories.length > 0 ? categories.map(cat => cat.totalSales || 0) : []
    };
    
    console.log('Category data result:', result);
    return result;
    
  } catch (error) {
    console.error("Error getting categories for period:", error);
    return { labels: [], data: [] };
  }
};

const getTopProductsForPeriod = async (startDate, endDate) => {
  try {
    console.log(`Fetching top products for period: ${startDate} to ${endDate}`);
    
    const products = await Order.aggregate([
      {
        $match: {
          status: {
            $in: [
              "Order Placed",
              "Order Confirmed",
              "Order Shipped", 
              "Delivered",
            ],
          },
          createdAt: { $gte: startDate, $lte: endDate },
        },
      },
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      { $unwind: "$productDetails" },
      {
        $group: {
          _id: "$orderItems.product",
          productName: { $first: "$productDetails.productName" },
          totalSales: {
            $sum: {
              $multiply: ["$orderItems.quantity", "$orderItems.price"],
            },
          },
          totalQuantity: { $sum: "$orderItems.quantity" },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    console.log(`Found ${products.length} top products for period`);

    // Calculate percentages
    const totalSalesValue = products.reduce(
      (sum, product) => sum + product.totalQuantity,
      0
    );

    const result = products.map((product) => ({
      ...product,
      percentage: totalSalesValue > 0 ? Math.round((product.totalQuantity / totalSalesValue) * 100) : 0,
    }));
    
    console.log('Top products result:', result);
    return result;
    
  } catch (error) {
    console.error("Error getting top products for period:", error);
    return [];
  }
};

 const loadDashboard = async (req, res) => {
  if (req.session.admin) {
    try {
      console.log('Loading dashboard...');
      
      const dateRanges = getDateRanges();
      console.log('Date ranges:', dateRanges);

      // Calculate stats for each period
      const weeklyStats = await calculatePeriodStats(
        dateRanges.weekly.start,
        dateRanges.weekly.end
      );
      const monthlyStats = await calculatePeriodStats(
        dateRanges.monthly.start,
        dateRanges.monthly.end
      );
      const yearlyStats = await calculatePeriodStats(
        dateRanges.yearly.start,
        dateRanges.yearly.end
      );

      console.log('Stats calculated:', { weeklyStats, monthlyStats, yearlyStats });

      // Get categories and products for each period
      const weeklyCategoryData = await getBestSellingCategoriesForPeriod(
        dateRanges.weekly.start,
        dateRanges.weekly.end
      );
      const monthlyCategoryData = await getBestSellingCategoriesForPeriod(
        dateRanges.monthly.start,
        dateRanges.monthly.end
      );
      const yearlyCategoryData = await getBestSellingCategoriesForPeriod(
        dateRanges.yearly.start,
        dateRanges.yearly.end
      );

      const weeklyTopProducts = await getTopProductsForPeriod(
        dateRanges.weekly.start,
        dateRanges.weekly.end
      );
      const monthlyTopProducts = await getTopProductsForPeriod(
        dateRanges.monthly.start,
        dateRanges.monthly.end
      );
      const yearlyTopProducts = await getTopProductsForPeriod(
        dateRanges.yearly.start,
        dateRanges.yearly.end
      );

      console.log('Period-specific data fetched');

      // Overall totals
      const revenueData = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Order Placed",
                "Order Confirmed",
                "Order Shipped", 
                "Delivered",
              ],
            },
          },
        },
        { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
      ]);
      const totalRevenue = revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

      const totalOrders = await Order.countDocuments();
      const totalProducts = await Product.countDocuments();
      const totalCategories = await Category.countDocuments();

      console.log('Overall totals:', { totalRevenue, totalOrders, totalProducts, totalCategories });

      // Monthly earning for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const monthlyEarningData = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Order Placed",
                "Order Confirmed",
                "Order Shipped",
                "Delivered",
              ],
            },
            createdAt: {
              $gte: new Date(`${currentYear}-${currentMonth}-01`),
              $lt: new Date(
                currentMonth === 12
                  ? `${currentYear + 1}-01-01`
                  : `${currentYear}-${currentMonth + 1}-01`
              ),
            },
          },
        },
        { $group: { _id: null, monthlyEarning: { $sum: "$totalAmount" } } },
      ]);
      const monthlyEarning = monthlyEarningData.length > 0 ? monthlyEarningData[0].monthlyEarning : 0;

      // Fixed Weekly sales chart data
      const startOfWeek = new Date();
      const dayOfWeek = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weeklySales = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Order Placed",
                "Order Confirmed",
                "Order Shipped",
                "Delivered",
              ],
            },
            createdAt: { $gte: startOfWeek, $lte: endOfWeek },
          },
        },
        {
          $group: {
            _id: { $dayOfWeek: "$createdAt" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Map to Monday-Sunday format
      const weeklyChartData = [0, 0, 0, 0, 0, 0, 0];
      weeklySales.forEach(item => {
        const dayIndex = item._id === 1 ? 6 : item._id - 2;
        if (dayIndex >= 0 && dayIndex < 7) {
          weeklyChartData[dayIndex] = item.totalAmount;
        }
      });

      console.log('Weekly chart data:', weeklyChartData);

      // Monthly sales chart data
      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
      const monthlySales = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Order Placed",
                "Order Confirmed",
                "Order Shipped",
                "Delivered",
              ],
            },
            createdAt: { $gte: startOfYear },
          },
        },
        {
          $group: {
            _id: { $month: "$createdAt" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const monthlyChartData = Array(12).fill(0);
      monthlySales.forEach(item => {
        if (item._id >= 1 && item._id <= 12) {
          monthlyChartData[item._id - 1] = item.totalAmount;
        }
      });

      console.log('Monthly chart data:', monthlyChartData);

      // Yearly sales chart data
      const yearStart = new Date();
      yearStart.setFullYear(yearStart.getFullYear() - 5);
      yearStart.setMonth(0, 1);
      yearStart.setHours(0, 0, 0, 0);

      const yearlySales = await Order.aggregate([
        {
          $match: {
            status: {
              $in: [
                "Order Placed",
                "Order Confirmed",
                "Order Shipped",
                "Delivered",
              ],
            },
            createdAt: { $gte: yearStart },
          },
        },
        {
          $group: {
            _id: { $year: "$createdAt" },
            totalAmount: { $sum: "$totalAmount" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const currentYearNum = new Date().getFullYear();
      const yearlyChartData = Array(6).fill(0);
      yearlySales.forEach(item => {
        const yearIndex = item._id - (currentYearNum - 5);
        if (yearIndex >= 0 && yearIndex < 6) {
          yearlyChartData[yearIndex] = item.totalAmount;
        }
      });

      console.log('Yearly chart data:', yearlyChartData);

      // Use monthly data as default for categories and products
      const categoryChartData = monthlyCategoryData;
      const topProducts = monthlyTopProducts;

      console.log('Final data being sent to template:', {
        categoryChartData,
        topProducts,
        weeklyCategoryData,
        monthlyCategoryData,
        yearlyCategoryData
      });

      res.render("admin/dashboard", {
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCategories,
        monthlyEarning,
        weeklyChartData,
        monthlyChartData,
        yearlyChartData,
        categoryChartData,
        topProducts,
        weeklyStats,
        monthlyStats,
        yearlyStats,
        weeklyCategoryData,
        monthlyCategoryData,
        yearlyCategoryData,
        weeklyTopProducts,
        monthlyTopProducts,
        yearlyTopProducts
      });
      
    } catch (error) {
      console.error("Dashboard load error:", error);
      res.redirect("/admin/pageerror");
    }
  } else {
    res.redirect("/admin/login");
  }
};
const logout = async(req,res)=>{
    try {
        req.session.destroy(err =>{
            if(err){
                console.log("Error destroying session ",err);
                return res.redirect('/pageerror')
            }
            res.redirect("/admin/login")
        })
        
    } catch (error) {
        console.log("unexpected error during logout",error);
        res.redirect("/pageerror")
    }
}

const getBestSellingCategories = async (req, res) => {
  try {
    const result = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $lookup: {
          from: "products",
          localField: "orderItems.product",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          totalSold: { $sum: "$orderItems.quantity" }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { $sort: { totalSold: -1 } },
      { $limit: 5 } // Top 5 categories
    ]);
    res.json({ success: true, bestSellingCategories: result });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching best selling categories" });
  }
};

module.exports = {
    loadLogin,
    login,
    loadDashboard,
    pageerror,
    logout,
    getBestSellingCategories,
};