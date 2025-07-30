const Order = require('../../models/orderSchema');
const moment = require('moment');
const path = require('path'); 
const fs = require('fs'); 
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const csv = require('fast-csv'); 
const Product = require('../../models/productSchema');
const Coupon = require("../../models/couponSchema");

const getDateRange = (filterType) => {
  const now = moment();
  let startDate, endDate;
  switch (filterType) {
    case 'today':
      startDate = now.clone().startOf('day');
      endDate = now.clone().endOf('day');
      break;
    case 'yesterday':
      startDate = now.clone().subtract(1, 'days').startOf('day');
      endDate = now.clone().subtract(1, 'days').endOf('day');
      break;
    case 'last7days':
      startDate = now.clone().subtract(7, 'days').startOf('day');
      endDate = now.clone().endOf('day');
      break;
    case 'last30days':
      startDate = now.clone().subtract(30, 'days').startOf('day');
      endDate = now.clone().endOf('day');
      break;
    case 'thisMonth':
      startDate = now.clone().startOf('month');
      endDate = now.clone().endOf('month');
      break;
    case 'lastMonth':
      startDate = now.clone().subtract(1, 'month').startOf('month');
      endDate = now.clone().subtract(1, 'month').endOf('month');
      break;
    case 'custom':
      return { startDate: null, endDate: null };
    default:
      startDate = now.clone().subtract(7, 'days').startOf('day');
      endDate = now.clone().endOf('day');
  }
  return { startDate: startDate.toDate(), endDate: endDate.toDate() };
};

const getOrderDiscount = (order) => {
  if (order.discount && order.discount > 0) {
    return order.discount;
  } else if (order.couponDiscount && order.couponDiscount > 0) {
    return order.couponDiscount;
  } else if (order.appliedCoupon && typeof order.appliedCoupon === 'object' && order.appliedCoupon.discount) {
    return order.appliedCoupon.discount;
  }
  return 0;
};

// Helper function to get coupon info from order
const getCouponInfo = (order) => {
  let couponCode = null;
  let couponName = null;
  let discountAmount = 0;

  // Check various possible field names for coupon information
  if (order.appliedCoupon) {
    if (typeof order.appliedCoupon === 'object') {
      couponCode = order.appliedCoupon.code || order.appliedCoupon.couponCode;
      couponName = order.appliedCoupon.name || order.appliedCoupon.couponName || order.appliedCoupon.title;
      discountAmount = order.appliedCoupon.discount || order.appliedCoupon.discountValue || 0;
    } else if (typeof order.appliedCoupon === 'string') {
      couponCode = order.appliedCoupon;
    }
  }

  // Fallback to other possible field names
  if (!couponCode && order.couponCode) {
    couponCode = order.couponCode;
  }
  if (!couponName && order.couponName) {
    couponName = order.couponName;
  }
  if (discountAmount === 0) {
    discountAmount = getOrderDiscount(order);
  }

  return { couponCode, couponName, discountAmount };
};

const processOrdersData = (orders) => {
  let totalRevenue = 0;
  let totalOrders = orders.length;
  let totalDiscount = 0;

  orders.forEach(order => {
    totalRevenue += order.totalAmount;
    totalDiscount += getOrderDiscount(order);
  });

  const salesByDay = {};
  const ordersByDay = {};
  orders.forEach(order => {
    const day = moment(order.createdAt).format('YYYY-MM-DD');
    salesByDay[day] = (salesByDay[day] || 0) + order.totalAmount;
    ordersByDay[day] = (ordersByDay[day] || 0) + 1;
  });
  
  const chartLabels = Object.keys(salesByDay).sort();
  const salesData = chartLabels.map(d => salesByDay[d]);
  const ordersData = chartLabels.map(d => ordersByDay[d]);

  const recentActivities = orders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4)
    .map(order => {
      const names = order.orderItems.map(i => i.product?.name || 'Product').join(', ');
      return { date: moment(order.createdAt).format('MMM DD'), amount: order.totalAmount, description: `Sale of ${names}` };
    });

  const monthlyEarning = orders
    .filter(o => moment(o.createdAt).isAfter(moment().startOf('month')))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  totalRevenue = parseFloat(totalRevenue.toFixed(1));
  totalDiscount = parseFloat(totalDiscount.toFixed(1));

  return {
    totalRevenue,
    totalOrders,
    totalDiscount,
    monthlyEarning: Number(monthlyEarning.toFixed(1)),
    chartData: { labels: chartLabels.map(d => moment(d).format('MMM DD')), salesData, ordersData },
    recentActivities,
    grossSales: totalRevenue + totalDiscount,
    netSales: totalRevenue
  };
};

const loadSalesReport = async (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  try {
    const {
      dateRange = 'last7days',
      startDate: qsStart,
      endDate: qsEnd,
      page: qsPage = 1,
      limit: qsLimit = 10
    } = req.query;
    const page = parseInt(qsPage, 10);
    const limit = parseInt(qsLimit, 10);

    let dateFilter;
    if (dateRange === 'custom' && qsStart && qsEnd) {
      dateFilter = {
        startDate: moment(qsStart).startOf('day').toDate(),
        endDate: moment(qsEnd).endOf('day').toDate()
      };
    } else {
      dateFilter = getDateRange(dateRange);
    }

    const allOrders = await Order.find({
      createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate },
      status: { $nin: ['Cancelled', 'Payment Failed'] }
    }).populate('orderItems.product')
      .populate('userId', 'name')
      .populate('address.addressDocId')
      .populate('appliedCoupon');

    const totalCount = allOrders.length;
    const totalPages = Math.ceil(totalCount / limit);
    const paginatedOrders = await Order.find({
      createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate },
      status: { $nin: ['Cancelled', 'Payment Failed'] }
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('orderItems.product')
    .populate('userId', 'name')
    .populate('address.addressDocId')
    .populate('appliedCoupon');

    const dashboardData = processOrdersData(allOrders);

    res.render('admin/salesReport', {
      dashboardData,
      orders: paginatedOrders,
      currentPage: page,
      totalPages,
      dateRange,
      startDate: dateFilter.startDate ? moment(dateFilter.startDate).format('YYYY-MM-DD') : '',
      endDate: dateFilter.endDate ? moment(dateFilter.endDate).format('YYYY-MM-DD') : '',
      moment,
      getOrderDiscount, // Add helper function to template
      getCouponInfo    // Add helper function to template
    });
  } catch (err) {
    console.error('Sales load error:', err);
    res.redirect('/admin/pageerror');
  }
};

const updateSales = async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ success: false, message: 'Not authorized' });
  try {
    const { dateRange, startDate, endDate } = req.body;
    const dateFilter = dateRange === 'custom' && startDate && endDate ? 
      { startDate: moment(startDate).startOf('day').toDate(), endDate: moment(endDate).endOf('day').toDate() } : 
      getDateRange(dateRange);
    
    const orders = await Order.find({ 
      createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate }, 
      status: { $nin: ['Cancelled', 'Payment Failed'] } 
    }).populate('orderItems.product').populate('appliedCoupon');
    
    const dashboardData = processOrdersData(orders);
    res.json({ 
      success: true, 
      dashboardData, 
      dateFilter: dateRange, 
      startDate: moment(dateFilter.startDate).format('YYYY-MM-DD'), 
      endDate: moment(dateFilter.endDate).format('YYYY-MM-DD') 
    });
  } catch (err) {
    console.error('Update sales error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const generatePDFReport = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, '../../public/reports');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `sales_report_${moment().format('YYYY-MM-DD_HH-mm-ss')}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      doc.fontSize(20).text('Sales Report', { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(12).text(`Report Period: ${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}`, { align: 'center' });
      doc.moveDown(2);
      
      doc.fontSize(16).text('Summary', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Total Orders: ${reportData.totalOrders}`);
      doc.fontSize(12).text(`Total Revenue: INR ${reportData.totalRevenue.toFixed(2)}`);
      
      if (reportData.totalDiscount) {
        doc.fontSize(12).text(`Total Discount: INR ${reportData.totalDiscount.toFixed(2)}`);
      }
      
      doc.moveDown(2);
      
      doc.fontSize(16).text('Order Details', { underline: true });
      doc.moveDown();
      
      const tableTop = doc.y;
      const tableLeft = 50;
      const colWidths = [60, 70, 60, 60, 60, 70, 80];
      
      let currentX = tableLeft;
      const headers = ['Order ID', 'Date', 'Amount', 'Discount', 'Status', 'Payment', 'Coupon'];
      
      headers.forEach((header, i) => {
        doc.fontSize(10).text(header, currentX, tableTop);
        currentX += colWidths[i];
      });
      
      doc.moveTo(tableLeft, tableTop + 15)
         .lineTo(tableLeft + colWidths.reduce((a, b) => a + b, 0), tableTop + 15)
         .stroke();
      
      let rowTop = tableTop + 20;
      const ordersToShow = reportData.orders.slice(0, 20);
      
      ordersToShow.forEach((order, i) => {
        if (rowTop > 700) {
          doc.addPage();
          rowTop = 50;
        }
        
        currentX = tableLeft;
        
        doc.fontSize(9).text(order.orderId, currentX, rowTop, { width: colWidths[0] });
        currentX += colWidths[0];
        
        doc.fontSize(9).text(order.date, currentX, rowTop, { width: colWidths[1] });
        currentX += colWidths[1];
        
        doc.fontSize(9).text(`INR ${order.totalAmount.toFixed(2)}`, currentX, rowTop, { width: colWidths[2] });
        currentX += colWidths[2];
        
        doc.fontSize(9).text(`INR ${order.discountAmount.toFixed(2)}`, currentX, rowTop, { width: colWidths[3] });
        currentX += colWidths[3];
        
        doc.fontSize(9).text(order.status, currentX, rowTop, { width: colWidths[4] });
        currentX += colWidths[4];
        
        doc.fontSize(9).text(order.paymentMethod, currentX, rowTop, { width: colWidths[5] });
        currentX += colWidths[5];
        
        doc.fontSize(8).text(order.couponCode || 'None', currentX, rowTop, { width: colWidths[6] });
        
        rowTop += 20;
      });
      
      if (reportData.orders.length > 20) {
        rowTop += 10;
        doc.fontSize(10).text(`Note: Showing 20 of ${reportData.orders.length} orders. Download the Excel for complete data.`, tableLeft, rowTop);
      }
      
      // Add coupon usage section
      if (reportData.couponsUsed && reportData.couponsUsed.length > 0) {
        doc.addPage();
        
        doc.fontSize(16).text('Coupon Usage Summary', { underline: true });
        doc.moveDown();
        
        const couponTableTop = doc.y;
        const couponColWidths = [100, 150, 80, 80];
        
        doc.fontSize(10).text('Code', tableLeft, couponTableTop);
        doc.text('Name', tableLeft + couponColWidths[0], couponTableTop);
        doc.text('Total Discount', tableLeft + couponColWidths[0] + couponColWidths[1], couponTableTop);
        doc.text('Usage Count', tableLeft + couponColWidths[0] + couponColWidths[1] + couponColWidths[2], couponTableTop);
        
        doc.moveTo(tableLeft, couponTableTop + 15)
           .lineTo(tableLeft + couponColWidths.reduce((a, b) => a + b, 0), couponTableTop + 15)
           .stroke();
        
        let couponRowTop = couponTableTop + 20;
        
        reportData.couponsUsed.forEach(coupon => {
          doc.fontSize(9).text(coupon.code, tableLeft, couponRowTop, { width: couponColWidths[0] });
          doc.fontSize(9).text(coupon.name, tableLeft + couponColWidths[0], couponRowTop, { width: couponColWidths[1] });
          doc.fontSize(9).text(`INR ${coupon.totalDiscount.toFixed(2)}`, tableLeft + couponColWidths[0] + couponColWidths[1], couponRowTop, { width: couponColWidths[2] });
          doc.fontSize(9).text(coupon.count, tableLeft + couponColWidths[0] + couponColWidths[1] + couponColWidths[2], couponRowTop, { width: couponColWidths[3] });
          
          couponRowTop += 20;
        });
      }
      
      doc.fontSize(10).text(`Report generated on ${moment().format('YYYY-MM-DD HH:mm:ss')}`, { align: 'center' });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve({
          fileName,
          filePath: `/reports/${fileName}`
        });
      });
      
      writeStream.on('error', reject);
      
    } catch (error) {
      reject(error);
    }
  });
};

const generateExcelReport = (reportData) => {
  return new Promise((resolve, reject) => {
    try {
      const uploadDir = path.join(__dirname, '../../public/reports');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      const fileName = `sales_report_${moment().format('YYYY-MM-DD_HH-mm-ss')}.xlsx`;
      const filePath = path.join(uploadDir, fileName);
      
      const workbook = new ExcelJS.Workbook();
      
      // Summary Sheet
      const summarySheet = workbook.addWorksheet('Summary');
      
      summarySheet.mergeCells('A1:E1');
      summarySheet.getCell('A1').value = 'Sales Report';
      summarySheet.getCell('A1').font = { size: 16, bold: true };
      summarySheet.getCell('A1').alignment = { horizontal: 'center' };
      
      summarySheet.mergeCells('A2:E2');
      summarySheet.getCell('A2').value = `Report Period: ${reportData.dateRange.startDate} to ${reportData.dateRange.endDate}`;
      summarySheet.getCell('A2').alignment = { horizontal: 'center' };
      
      summarySheet.getCell('A4').value = 'Summary';
      summarySheet.getCell('A4').font = { size: 12, bold: true };
      
      summarySheet.getCell('A5').value = 'Total Orders:';
      summarySheet.mergeCells('C5:D5')
      summarySheet.getCell('C5').value = reportData.totalOrders;
      
      summarySheet.getCell('A6').value = 'Total Revenue:';
      summarySheet.mergeCells('C6:D6')
      summarySheet.getCell('C6').value = reportData.totalRevenue;
      summarySheet.getCell('C6').numFmt = '₹#,##0.00';
      
      if (reportData.totalDiscount) {
        summarySheet.getCell('A7').value = 'Total Discount:';
        summarySheet.mergeCells('C7:D7')
        summarySheet.getCell('C7').value = reportData.totalDiscount;
        summarySheet.getCell('C7').numFmt = '₹#,##0.00';
      }
      
      // Orders Sheet
      const ordersSheet = workbook.addWorksheet('Orders');
      
      ordersSheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'Customer', key: 'customer', width: 20 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Discount', key: 'discount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 15 },
        { header: 'Coupon Code', key: 'couponCode', width: 15 },
        { header: 'Coupon Name', key: 'couponName', width: 20 }
      ];
      
      ordersSheet.getRow(1).font = { bold: true };
      
      reportData.orders.forEach(order => {
        ordersSheet.addRow({
          orderId: order.orderId,
          customer: order.customer,
          date: order.date,
          amount: order.totalAmount,
          discount: order.discountAmount,
          status: order.status,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          couponCode: order.couponCode || '',
          couponName: order.couponName || ''
        });
      });
      
      ordersSheet.getColumn('amount').numFmt = '₹#,##0.00';
      ordersSheet.getColumn('discount').numFmt = '₹#,##0.00';
      
      // Coupons Sheet
      if (reportData.couponsUsed && reportData.couponsUsed.length > 0) {
        const couponsSheet = workbook.addWorksheet('Coupon Usage');
        
        couponsSheet.columns = [
          { header: 'Code', key: 'code', width: 15 },
          { header: 'Name', key: 'name', width: 25 },
          { header: 'Total Discount', key: 'totalDiscount', width: 15 },
          { header: 'Usage Count', key: 'count', width: 15 }
        ];
        
        couponsSheet.getRow(1).font = { bold: true };
        
        reportData.couponsUsed.forEach(coupon => {
          couponsSheet.addRow({
            code: coupon.code,
            name: coupon.name,
            totalDiscount: coupon.totalDiscount,
            count: coupon.count
          });
        });
        
        couponsSheet.getColumn('totalDiscount').numFmt = '₹#,##0.00';
      }
      
      workbook.xlsx.writeFile(filePath)
        .then(() => {
          resolve({
            fileName,
            filePath: `/reports/${fileName}`
          });
        })
        .catch(reject);
      
    } catch (error) {
      reject(error);
    }
  });
};

const generateReport = async (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  
  try {
    const { 
      reportType, 
      startDate, 
      endDate, 
      includeDiscount, 
      includeSalesCount, 
      includeOrderAmount,
      reportFormat 
    } = req.body;
    
    let dateFilter = {};
    
    if (reportType === 'custom' && startDate && endDate) {
      dateFilter = {
        startDate: moment(startDate).startOf('day').toDate(),
        endDate: moment(endDate).endOf('day').toDate()
      };
    } else {
      dateFilter = getDateRange(reportType);
    }
    
    const orders = await Order.find({
      createdAt: { $gte: dateFilter.startDate, $lte: dateFilter.endDate },
      status: { $nin: ['Cancelled', 'Payment Failed'] }
    }).populate('orderItems.product userId appliedCoupon');
    
    // Process coupon usage data
    const couponsUsed = {};
    let totalDiscount = 0;
    
    const processedOrders = orders.map(order => {
      const couponInfo = getCouponInfo(order);
      const discountAmount = getOrderDiscount(order);
      
      totalDiscount += discountAmount;
      
      // Track coupon usage
      if (couponInfo.couponCode) {
        if (!couponsUsed[couponInfo.couponCode]) {
          couponsUsed[couponInfo.couponCode] = {
            code: couponInfo.couponCode,
            name: couponInfo.couponName || couponInfo.couponCode,
            totalDiscount: 0,
            count: 0
          };
        }
        couponsUsed[couponInfo.couponCode].totalDiscount += discountAmount;
        couponsUsed[couponInfo.couponCode].count += 1;
      }
      
      return {
        orderId: order.orderId,
        customer: order.userId ? `${order.userId.firstName || ''} ${order.userId.lastName || ''}`.trim() || order.userId.name : 'Unknown',
        date: moment(order.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        totalAmount: order.totalAmount,
        discountAmount: discountAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        couponCode: couponInfo.couponCode,
        couponName: couponInfo.couponName
      };
    });
    
    const reportData = {
      reportType,
      dateRange: {
        startDate: moment(dateFilter.startDate).format('YYYY-MM-DD'),
        endDate: moment(dateFilter.endDate).format('YYYY-MM-DD')
      },
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      totalDiscount: totalDiscount,
      orders: processedOrders,
      couponsUsed: Object.values(couponsUsed)
    };
    
    let reportFile;
    
    switch (reportFormat.toLowerCase()) {
      case 'pdf':
        reportFile = await generatePDFReport(reportData);
        break;
      case 'excel':
        reportFile = await generateExcelReport(reportData);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid report format' });
    }
    
    res.json({
      success: true,
      reportData,
      reportFile,
      message: `Report generated successfully in ${reportFormat.toUpperCase()} format`
    });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  loadSalesReport,
  updateSales,
  generateReport,
};