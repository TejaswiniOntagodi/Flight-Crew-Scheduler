
const mongoose = require("mongoose");

// Availability details for cabin crew
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

// Cabin crew details
const cabinCrewSchema = new mongoose.Schema(
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

    qualifications: {
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

module.exports = mongoose.model("CabinCrew", cabinCrewSchema);
