
const Address = require('../../models/addressSchema'); 
const mongoose = require('mongoose');


const getMyAddresses = async (req, res) => {
  try {
    const userId = req.user._id;
    const address = await Address.findOne({ userId });
    if (!address) {
      return res.render('user/address', { addresses: [] });
    }
    res.render('user/address', { addresses: address.address });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
  };
  

  const getAddMyAddressesPage = async (req, res) => {
    try {
      res.render("user/addMyAddresses");
    } catch (error) {
      res.redirect('/pageerror');
    }
  };

  const addMyAddresses = async (req, res) => {
    try {
      req.body = req.body.details[0]
      const userId = req.user._id; 
      const { addressType, name, addressLine1, addressLine2, city, state, pincode, phone, altPhone, landmark } = req.body;
 
      let addressDoc = await Address.findOne({ userId });
      
  
      if(!addressDoc ){
        addressDoc = new Address({
          userId,
          address:[]
        });
      }
      console.log(addressDoc)

      const newIndex = addressDoc.address.length;
      const isDefault = addressDoc.address.length === 0;
      console.log(newIndex,"newindexxxxxxx")

    addressDoc.address.push({
        index : newIndex,
        addressType,
        name,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        phone,
        altPhone,
        landmark,
        isDefault,
      });
  
  
      await addressDoc.save();
      console.log(addressDoc,"kkkkkkkkkk");
      
  
      console.log("Address saved successfully");
      return res.redirect("/myAddresses?success=Address added successfully");
    } catch (error) {
      console.error("Error adding address:", error);
      return res.redirect("/myAddresses?error=Internal Server Error");
    }
  };

  // default

  const setDefaultAddress = async (req, res) => {
    try {
      const userId = req.user._id;
      const addressId = req.params.addressId;
      
      const addressDoc = await Address.findOne({ userId });
      if (!addressDoc) return res.status(404).send('Address not found');
      
      // Set all addresses to non-default
      addressDoc.details.forEach(addr => {
        addr.isDefault = false;
      });
      
      // Find the address we want to set as default
      const addressToDefault = addressDoc.details.id(addressId);
      if (!addressToDefault) return res.status(404).send('Address not found');
      
      // Set it as default
      addressToDefault.isDefault = true;
      
      await addressDoc.save();
      
      return res.redirect('/checkout?success=Default address updated');
    } catch (err) {
      console.error(err);
      return res.status(500).send('Server error');
    }
  };
  // fghjk

  const deleteAddress = async (req, res) => {
    try {
      const userId = req.user._id;
      const detailId = req.params.detailId;
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
    const userId   = req.user._id;
    const detailId = req.query.id;
  
    if (!mongoose.Types.ObjectId.isValid(detailId)) {
      return res.status(400).send('Invalid address ID');
    }
  
    try {
      const addressDoc = await Address.findOne({ userId });
      if (!addressDoc) return res.status(404).send('Address document not found');
  
      let addressDetail;
      addressDoc.address.forEach(addr=> {
        if(addr._id.toString() === detailId.toString()){
          addressDetail = addr;
        }
      })
      console.log(addressDetail)
      if (!addressDetail) return res.status(404).send('Address not found');
      
      console.log("hai shibi");
      return res.render('user/editAddresses', {
      address: addressDetail,
      detailId
    });
    } catch (error) {
      console.error('Error in getEditMyAddressPage:', error);
      return res.redirect('/pageerror');
    }
  };
  
  // **NEW**: Update a specific address in-place
  const editMyAddresses = async (req, res) => {
    try {
      const userId   = req.user._id;
      const detailId = req.params.detailId;
  
      // 1) Grab the updated sub‑document from the nested form
      const updated = Array.isArray(req.body.details)
        ? req.body.details[0]
        : {};
  
      // 2) Destructure your fields out of it
      const {
        addressType,
        name,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
        phone,
        altPhone,
        landmark
      } = updated;
  
      // 3) Was “Set as default” checked?
      const makeDefault = req.body.defaultAddress === 'on';
  
      // 4) Fetch your parent doc
      const addressDoc = await Address.findOne({ userId });
      if (!addressDoc) {
        return res.redirect('/myAddresses?error=Address not found');
      }
  
      // 5) Find the exact sub‑document
     let addressDetail;
      addressDoc.address.forEach(addr=> {
        if(addr._id.toString() === detailId.toString()){
          addressDetail = addr;
        }
      })
      if (!addressDetail) {
        return res.redirect('/myAddresses?error=Address not found');
      }
  
      // 6) Overwrite the fields
      addressDetail.name         = name;
      addressDetail.phone        = phone;
      addressDetail.altPhone     = altPhone;
      addressDetail.landmark     = landmark;
      addressDetail.addressLine1 = addressLine1;
      addressDetail.addressLine2 = addressLine2;
      addressDetail.city         = city;
      addressDetail.state        = state;
      addressDetail.pincode      = pincode;
      addressDetail.addressType  = addressType;
  
      // 7) Handle the default‑address checkbox
      if (makeDefault) {
        addressDoc.details.forEach(a => (a.isDefault = false));
        addressDetail.isDefault = true;
      }
  
      // 8) Save & redirect
      await addressDoc.save();
      return res.redirect('/myAddresses?success=Address updated');
    } catch (error) {
      console.error('Error editing address:', error);
      return res.redirect('/myAddresses?error=Internal Server Error');
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