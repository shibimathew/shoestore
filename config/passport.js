const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/userSchema");
const env = require("dotenv").config();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refeshToken, profile, done) => {
      try {
        // First check if user exists by Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          if (user.isBlocked) {
            return done(null, false, {
              message:
                "Your account has been blocked by admin. Please contact customer support.",
            });
          } else {
            return done(null, user);
          }
        } else {
          // If not found by Google ID, check if user exists by email
          const existingUser = await User.findOne({
            email: profile.emails[0].value,
          });

          if (existingUser) {
            // If user exists with this email but no Google ID, update the user with Google ID
            existingUser.googleId = profile.id;
            await existingUser.save();

            return done(null, existingUser);
          } else {
            // Create new user if no existing user found
            user = new User({
              name: profile.displayName,
              email: profile.emails[0].value,
              googleId: profile.id,
              phone: "0000000000", // Initialize with default phone number
              isVerified: true, // Google accounts are pre-verified
            });
            await user.save();
            return done(null, user);
          }
        }
      } catch (error) {
        console.error("Google authentication error:", error);
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  //to assign user details to session
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
