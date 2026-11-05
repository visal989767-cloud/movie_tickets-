const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  birthdate: { type: Date },
  avatar: { type: String },
  bio: { type: String },
  stats: {
    bookings: { type: Number, default: 0 },
    favorites: { type: Number, default: 0 },
    rewards: { type: Number, default: 0 },
    reviews: { type: Number, default: 0 }
  }
}, {
  versionKey: false 
});

module.exports = mongoose.model('Profile', ProfileSchema);