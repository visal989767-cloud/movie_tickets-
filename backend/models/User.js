
      const mongoose = require('mongoose');
      const userSchema = new mongoose.Schema({
        id: { type: Number, unique: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        role: { type: String, default: 'user' },
        avatar: { type: String },
        membership: { type: String, default: 'standard' },
        favoriteGenres: [{ type: String }],
        createdAt: { type: Date, default: Date.now }
      });
      module.exports = mongoose.model('User', userSchema);
    