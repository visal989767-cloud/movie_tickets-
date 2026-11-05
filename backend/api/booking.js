const router = require("express").Router();
const Booking = require("../models/Booking");

router.post("/", async (req,res)=>{
    const booking = new Booking(req.body);
    await booking.save();
    res.json("Booked!");
});

module.exports = router;