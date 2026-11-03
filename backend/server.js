require('dotenv').config();

const express = require('express');
const cors = require('cors');

const mongoose = require('mongoose');

const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const Asteroid = require('./models/Asteroid');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let favoriteAsteroids = [];

app.get('/asteroids/favorites', ClerkExpressRequireAuth(), async (req, res) => {
    try {
        const loggedInUserId = req.auth.userId;

        const favorites = await Asteroid.find({ userId: loggedInUserId });

        res.status(200).json(favorites);
    }
    catch (err) {
        res.status(500).json({ message: "Error fetching from database", error: err});
    }
});

app.patch('/asteroids/favorites/:name', ClerkExpressRequireAuth(), async (req, res) => {
    const { name } = req.params;
    const { note } = req.body;

    try {
        const loggedInUserId = req.auth.userId;

        const updatedAsteroid = await Asteroid.findOneAndUpdate(
            { name: name, userId: loggedInUserId },
            { note: note },
            { new: true }
        );

        if (!updatedAsteroid) {
            return res.status(404).json({ message: "Asteroid not found in database!"});
        }

        res.status(200).json(updatedAsteroid);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to update asteroid note", error: err });
    }
});

app.delete('/asteroids/favorites/:name', ClerkExpressRequireAuth(), async (req, res) => {
    const { name } = req.params;

    try {
        const loggedInUserId = req.auth.userId;

        const result = await Asteroid.deleteOne({ name: name, userId: loggedInUserId});

        if (result.deletedCount === 0) {
            return res.status(404).json({ message: "Asteroid not found in your database!" });
        }

        res.status(200).json({ message: "Successfully removed from the database." });
    }
    catch (err) {
        res.status(500).json({ message: "Error deleting from database", error: err });
    }
});

app.post('/asteroids/favorites', ClerkExpressRequireAuth(), async (req, res) => {
    const { name, potentiallyHazardous } = req.body;

    if (!name) {
        return res.status(400).json({message: "No favorite asteroid data provided."});
    }

    try {
        const loggedInUserId = req.auth.userId;

        const newFavorite = new Asteroid({
             name: name,
             potentiallyHazardous: potentiallyHazardous,
             userId: loggedInUserId
            });

        await newFavorite.save();

        res.status(201).json(newFavorite);
    }
    catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: "Asteroid already favorited!" });
        }
        res.status(500).json({ message: "Error saving to database", error: err});
    }
});

app.get('/', (req, res) => {
    res.json({ message: "Houston, the Asteroid Tracker server is online!" });
});

app.get('/asteroids', async (req, res) => {
    const rawDate = new Date();
    const rawISO = rawDate.toISOString();
    const today = rawISO.split('T')[0];

    const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${today}&end_date=${today}&api_key=j7ASJZKYw91SaZmonl9HCLGACh586lgDAH0MoNYd`);

    const data = await response.json();

    if (data.error) {
        return res.json({message: "API failed!", details: data.error.message});
    }

    const rawAsteroids = data.near_earth_objects[today];

    const cleanAsteroids = rawAsteroids.map((asteroid) => {
        return {
            name: asteroid.name,
            estimatedDiameter: asteroid.estimated_diameter.meters.estimated_diameter_max,
            potentiallyHazardous: asteroid.is_potentially_hazardous_asteroid
        };
    });

    res.json(cleanAsteroids);
});

app.get('/asteroids/search', async (req, res) => {
    const targetDate = req.query.date;

    if (!targetDate) {
        return res.json({message: "Please provide a date query, e.g., ?date=YYYY-MM-DD" });
    }

    try {
        
        const response = await fetch(`https://api.nasa.gov/neo/rest/v1/feed?start_date=${targetDate}&end_date=${targetDate}&api_key=j7ASJZKYw91SaZmonl9HCLGACh586lgDAH0MoNYd`);

        const data = await response.json();

        const rawAsteroids = data.near_earth_objects[targetDate];

        const cleanAsteroids = rawAsteroids.map((asteroid) => {
            return {
                name: asteroid.name,
                estimatedDiameter: asteroid.estimated_diameter.meters.estimated_diameter_max,
                potentiallyHazardous: asteroid.is_potentially_hazardous_asteroid
            };
        });

        res.json(cleanAsteroids);
    }
    catch (error) {
        res.json({error: "Failed to fetch today's asteroid data."});
    }
});

app.get('/asteroids/:id', async (req, res) => {
    const asteroidID = req.params.id;

    if (!asteroidID) {
        return res.json({error: "Mission aborted: No asteroid ID provided"});
    }
    
    try {

        const response = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/${asteroidID}?api_key=j7ASJZKYw91SaZmonl9HCLGACh586lgDAH0MoNYd`);

        const data = await response.json();

        res.json({
            name: data.name,
            absoluteMagnitudeH: data.absolute_magnitude_h,
            potentiallyHazardous: data.is_potentially_hazardous_asteroid
        });
    }
    catch (error) {
        res.json({error: "Failed to fetch specific asteroid data." });
    }
});

mongoose.connect(process.env.MONGO_URL)
    .then(() => {
        console.log("Connected to MongoDB Freezer!");
    })
    .catch((err) => {
        console.error("Failed to connect to MongoDB: ", err);
    });

app.listen(PORT, () => {
    console.log(`Server is orbiting on http://localhost:${PORT}'`);
});