const axios = require("axios");

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_URL =
  "https://maps.googleapis.com/maps/api/place/nearbysearch/json";
const GEOCODE_API_URL = "https://maps.googleapis.com/maps/api/geocode/json";

/**
 * Calculate distance in km between two lat/lng points (Haversine formula).
 */
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2);
};

// @desc    Get nearby hospitals
// @route   GET /api/hospitals?lat=...&lng=...&radius=5000
// @access  Public
const getNearbyHospitals = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: "Please provide latitude (lat) and longitude (lng).",
      });
    }

    if (!GOOGLE_MAPS_API_KEY || GOOGLE_MAPS_API_KEY === "your_google_api_key") {
      return res.status(503).json({
        success: false,
        message:
          "Google Maps API key is not configured. Please add it to your .env file.",
      });
    }

    const response = await axios.get(PLACES_API_URL, {
      params: {
        location: `${lat},${lng}`,
        radius: Number(radius),
        type: "hospital",
        key: GOOGLE_MAPS_API_KEY,
      },
      timeout: 10000,
    });

    if (response.data.status !== "OK" && response.data.status !== "ZERO_RESULTS") {
      return res.status(502).json({
        success: false,
        message: `Google Places API error: ${response.data.status}`,
      });
    }

    const hospitals = (response.data.results || []).map((place) => ({
      id: place.place_id,
      name: place.name,
      address: place.vicinity || "Address not available",
      rating: place.rating || null,
      totalRatings: place.user_ratings_total || 0,
      isOpen: place.opening_hours?.open_now ?? null,
      distance: getDistanceKm(
        parseFloat(lat),
        parseFloat(lng),
        place.geometry.location.lat,
        place.geometry.location.lng
      ),
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng,
      },
    }));

    // Sort by distance
    hospitals.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    res.status(200).json({
      success: true,
      data: {
        count: hospitals.length,
        hospitals,
      },
    });
  } catch (error) {
    console.error("Hospital finder error:", error.message);
    res.status(500).json({
      success: false,
      message: "Error fetching nearby hospitals. Please try again.",
    });
  }
};

module.exports = { getNearbyHospitals };
