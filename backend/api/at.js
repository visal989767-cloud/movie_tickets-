const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");

// REGISTER
router.post("/register", async (req,res)=>{
    const hashed = await bcrypt.hash(req.body.password,10);

    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashed
    });

    await user.save();
    res.json("User Registered");
});

// LOGIN
router.post("/login", async (req,res)=>{
    const user = await User.findOne({email: req.body.email});
    if(!user) return res.status(400).json("User not found");

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if(!isMatch) return res.status(400).json("Wrong password");

    res.json(user);
});

module.exports = router;