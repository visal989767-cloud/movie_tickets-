
//      const mongoose = require('mongoose');
//      const userSchema = new mongoose.Schema({
      //  username: { type: String, required: true, unique: true },
       // email: { type: String, required: true, unique: true },
        //password: { type: String, required: true },
        //avatar: { type: String },
        //membership: { type: String, default: 'standard' },
       // favoriteGenres: [{ type: String }],
       // createdAt: { type: Date, default: Date.now }
      //});
      //module.exports = mongoose.model('User', userSchema);
      /// models/User.js
//class User {
   // constructor(name, email, password, role = 'customer') {
      //  this.name = name;
       // this.email = email;
       //this.password = password;
        //this.role = role; // Default is customer
    //}
//}

//module.exports = User;

const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

module.exports = mongoose.model("User", UserSchema);
    