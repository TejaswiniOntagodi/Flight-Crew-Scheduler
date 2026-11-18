
const mongoose = require("mongoose");

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    source: {
      type: String,
      required: true
    },

    destination: {
      type: String,
      required: true
    },

    departureTime: {
      type: Date,
      required: true
    },

    arrivalTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.departureTime;
        },
        message: "Arrival time must be after departure time"
      }
    },

    aircraftType: {
      type: String,
      required: true
    },

    requiredPilots: {
      type: Number,
      required: true,
      min: 1
    },

    requiredPilotRanks: {
      type: [String],
      enum: ["Captain", "First Officer"],
      required: true
    },

    requiredCabinCrew: {
      type: Number,
      required: true,
      min: 0
    },

    requiredCabinQualifications: {
      type: [String],
      default: []
    },

    status: {
      type: String,
      enum: ["Scheduled", "Delayed", "Cancelled"],
      default: "Scheduled"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Flight", flightSchema);
