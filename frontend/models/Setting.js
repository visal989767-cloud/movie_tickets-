const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  account: { type: Object },
  notifications: { type: Object },
  preferences: { type: Object },
  privacy: { type: Object }
}, {
  versionKey: false 
});

module.exports = mongoose.model('Setting', SettingSchema);