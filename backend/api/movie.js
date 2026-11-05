const router = require("express").Router();
const Movie = require("../models/Movie");

// GET movies
router.get("/", async (req, res) => {
    const movies = await Movie.find();
    res.json(movies);
});

// RATE movie
router.post("/rate/:id", async (req, res) => {
    const movie = await Movie.findById(req.params.id);

    if (!movie) return res.status(404).json("Movie not found");

    movie.rating = req.body.rating;
    await movie.save();

    res.json("Rated");
});

module.exports = router;