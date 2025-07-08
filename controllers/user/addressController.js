const Address = require('../../models/addressSchema'); 
const User = require('../../models/userSchema')
const mongoose = require('mongoose');

const getMyAddresses = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user|| req.session?.user?._id;
    if (!userId) {
      return res.status(401).render('user/login', { message: 'Please login to view addresses' });
    }
    const address = await Address.findOne({ userId });
    if (!address) {
      return res.render('user/address', { addresses: [], user: req.session?.user || req.user });
    }
    res.render('user/address', { addresses: address.address , user: req.session?.user || req.user});
  } catch (err) {
    console.error('Error fetching addresses:', err);
    res.status(500).render('error', { message: 'Server error while fetching addresses' });
  }
};

const getAddMyAddressesPage = async (req, res) => {
  try {
    const redirect = req.query.redirect||"addresses"
    const userId = req.user?._id || req.session?.user|| req.session?.user?._id;
    if (!userId) {
      return res.status(401).render('user/login', { message: 'Please login to add addresses' });
    }
    res.render("user/addMyAddresses",{ user: req.session?.user || req.user,redirect});
  } catch (error) {
    console.error('Error loading add address page:', error);
    res.redirect('/pageerror');
  }
};

const addMyAddresses = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?._id || req.session?.user;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }
    const userExists = await User.findById(userId);
    if (!userExists) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }console.log(req.body)
    const {name = '',phone = '',altPhone = '',landmark = '',addressLine1 = '', addressLine2 = '',city = '',state = '',pincode = '',addressType = '',defaultAddress = false,redirect} = req.body;
    const requiredFields = {
      name: name.toString().trim(),
      phone: phone.toString().trim(),
      addressLine1: addressLine1.toString().trim(),
      city: city.toString().trim(),
      state: state.toString().trim(),
      pincode: pincode.toString().trim(),
      addressType: addressType.toString().trim()
    };
    const missingFields = [];
    Object.keys(requiredFields).forEach(field => {
      if (!requiredFields[field] || requiredFields[field].length === 0) {
        missingFields.push(field);
      }
    });
    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      return res.status(400).json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields,
        receivedData: req.body
      });
    }
    if (requiredFields.name.length < 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name must be at least 3 characters long' 
      });
    }
    if (requiredFields.addressLine1.length < 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Address Line 1 must be at least 5 characters long' 
      });
    }
    if (requiredFields.city.length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'City must be at least 2 characters long' 
      });
    }
    if (!/^[6789]\d{9}$/.test(requiredFields.phone)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 10-digit phone number starting with 6, 7, 8, or 9' 
      });
    }
    if (!/^\d{6}$/.test(requiredFields.pincode)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit postal code' 
      });
    }
    if (altPhone && altPhone.toString().trim() && !/^[6789]\d{9}$/.test(altPhone.toString().trim())) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid alternative phone number' 
      });
    }
    const validAddressTypes = ['Home', 'Office', 'Other'];
    if (!validAddressTypes.includes(requiredFields.addressType)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please select a valid address type (Home, Office, or Other)' 
      });
    }
    const pincodeNum = parseInt(requiredFields.pincode);
    if (isNaN(pincodeNum) || pincodeNum < 100000 || pincodeNum > 999999) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please enter a valid 6-digit postal code' 
      });
    }
    let addressDoc = await Address.findOne({ userId });

    if (!addressDoc) {
      addressDoc = new Address({
        userId,
        address: []
      });
    }
    const isDefault = addressDoc.address.length === 0 || defaultAddress === 'on' || defaultAddress === true;
    if (isDefault) {
      addressDoc.address.forEach(addr => {
        addr.isDefault = false;
      });
    }
    const newAddress = {
      addressType: requiredFields.addressType,
      name: requiredFields.name,
      addressLine1: requiredFields.addressLine1,
      addressLine2: addressLine2 ? addressLine2.toString().trim() : '',
      city: requiredFields.city,
      state: requiredFields.state,
      pincode: pincodeNum,
      phone: requiredFields.phone,
      altPhone: altPhone ? altPhone.toString().trim() : '',
      landmark: landmark ? landmark.toString().trim() : '',
      isDefault,
    };

    console.log("New address to be saved:", JSON.stringify(newAddress, null, 2))
    addressDoc.address.push(newAddress);
    await addressDoc.save();
    if(redirect==='checkout'){
      return res.redirect('/checkout')
    }else{
    return res.redirect("/myAddresses?success=Address added successfully");
    }
  } catch (error) {
    console.error("Error adding address:", error);
  
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed: ' + validationErrors.join(', '),
        errors: validationErrors
      });
    }
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate entry detected',
        error: error.message
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: error.message
    });
  }
};
const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?._id || req.session?.user;
    const addressId = req.params.addressId;
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }
    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) return res.status(404).send('Address not found');
    addressDoc.address.forEach(addr => {
      addr.isDefault = false;
    });
    const addressToDefault = addressDoc.address.id(addressId);
    if (!addressToDefault) return res.status(404).send('Address not found');
    addressToDefault.isDefault = true; 
    await addressDoc.save();
    return res.redirect('/checkout?success=Default address updated');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};
const deleteAddress = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?._id || req.session?.user;
    const detailId = req.params.detailId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }
    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) return res.status(404).send('Address not found');
    
    addressDoc.address.pull({ _id: detailId });
    await addressDoc.save();
    
    return res.status(200).send('Address deleted');
  } catch (err) {
    console.error(err);
    return res.status(500).send('Server error');
  }
};

const getEditMyAddressPage = async (req, res) => {
  const userId = req.user?._id || req.session?.user?._id || req.session?.user;
  const detailId = req.query.id;

  if (!userId) {
    return res.redirect('/login');
  }

  if (!mongoose.Types.ObjectId.isValid(detailId)) {
    return res.status(400).send('Invalid address ID');
  }

  try {
    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) return res.status(404).send('Address document not found');
    let addressDetail;
    addressDoc.address.forEach(addr => {
      if (addr._id.toString() === detailId.toString()) {
        addressDetail = addr;
      }
    });
    if (!addressDetail) return res.status(404).send('Address not found');
    return res.render('user/editAddresses', {
      address: addressDetail,
      detailId
    });
  } catch (error) {
    console.error('Error in getEditMyAddressPage:', error);
    return res.redirect('/pageerror');
  }
};

const editMyAddresses = async (req, res) => {
  try {
    const userId = req.user?._id || req.session?.user?._id || req.session?.user;
    const detailId = req.params.detailId;
    if (!userId) {
      return res.redirect('/login');
    }
    const updated = Array.isArray(req.body.details)
      ? req.body.details[0]
      : req.body.details ? req.body.details['0'] : req.body;
    const {
      addressType,name,addressLine1,addressLine2,city,state,pincode,phone,  altPhone,landmark} = updated;
    const makeDefault = req.body.defaultAddress === 'on';
    const addressDoc = await Address.findOne({ userId });
    if (!addressDoc) {
      return res.redirect('/addresses?error=Address not found');
    }
    let addressDetail;
    addressDoc.address.forEach(addr => {
      if (addr._id.toString() === detailId.toString()) {
        addressDetail = addr;
      }
    });
    
    if (!addressDetail) {
      return res.redirect('/addresses?error=Address not found');
    }
    addressDetail.name = name;
    addressDetail.phone = phone;
    addressDetail.altPhone = altPhone || '';
    addressDetail.landmark = landmark || '';
    addressDetail.addressLine1 = addressLine1;
    addressDetail.addressLine2 = addressLine2 || '';
    addressDetail.city = city;
    addressDetail.state = state;
    addressDetail.pincode = parseInt(pincode);
    addressDetail.addressType = addressType;
    if (makeDefault) {
      addressDoc.address.forEach(a => (a.isDefault = false));
      addressDetail.isDefault = true;
    }
    await addressDoc.save();
    return res.redirect('/addresses?success=Address updated');
  } catch (error) {
    console.error('Error editing address:', error);
    return res.redirect('/addresses?error=Internal Server Error');
  }
};

module.exports = {
  getMyAddresses, 
  getAddMyAddressesPage, 
  addMyAddresses,
  getEditMyAddressPage,
  editMyAddresses,
  deleteAddress,
  setDefaultAddress,
};