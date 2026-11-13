
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    flightId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Flight",
      required: true
    },

    crewMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    crewType: {
      type: String,
      enum: ["Pilot", "CabinCrew"],
      required: true
    },

    assignedRole: {
      type: String,
      required: true
    },

    flightDepartureTime: {
      type: Date,
      required: true
    },

    flightArrivalTime: {
      type: Date,
      required: true,
      validate: {
        validator: function (value) {
          return value > this.flightDepartureTime;
        },
        message: "Flight arrival time must be after departure time"
      }
    },

    assignmentStatus: {
      type: String,
      enum: ["Assigned", "Completed", "Cancelled"],
      default: "Assigned"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
