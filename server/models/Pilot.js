
const mongoose = require("mongoose");

// Availability details for each pilot
const availabilitySchema = new mongoose.Schema(
  {
    startTime: {
      type: Date,
      required: true
    },

    endTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.startTime;
        },
        message: "End time must be after start time"
      }
    },

    status: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

// Pilot details
const pilotSchema = new mongoose.Schema(
  {
    employeeId: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    name: {
      type: String,
      required: true,
      trim: true
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },

    licenseNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },

    isLicenseValid: {
      type: Boolean,
      required: true
    },

    licenseExpiryDate: {
      type: Date,
      required: true
    },

    rank: {
      type: String,
      enum: ["Captain", "First Officer"],
      required: true
    },

    aircraftQualifications: {
      type: [String],
      default: []
    },

    availability: {
      type: [availabilitySchema],
      default: []
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pilot", pilotSchema);
