const User = require("../../models/userSchema");
const bcrypt = require("bcrypt");

const pageerror = async (req, res) => {
  res.render("admin/pageerror");
};

const loadLogin = (req, res) => {
  if (req.session.admin) {
    return res.redirect("/admin/dashboard");
  }
  res.render("admin/login", { message: null });
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, isAdmin: true });

    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);
      if (passwordMatch) {
        req.session.admin = admin;
        return res.redirect("/admin/dashboard");
      }
    } else {
      return res.redirect("/login");
    }
  } catch (error) {
    console.log("Login error:", error);
    return res.redirect("/admin/pageerror");
  }
};
const logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log("Error destroying session ", err);
        return res.redirect("/pageerror");
      }
      res.redirect("/admin/login");
    });
  } catch (error) {
    console.log("unexpected error during logout", error);
    res.redirect("/pageerror");
  }
};

module.exports = {
  loadLogin,
  login,
  pageerror,
  logout}