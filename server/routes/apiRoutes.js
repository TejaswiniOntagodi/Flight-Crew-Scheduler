const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

// Import database models
const Pilot = require("../models/Pilot");
const Flight = require("../models/Flight");
const CabinCrew = require("../models/CabinCrew");
const Assignment = require("../models/Assignment");

// Import scheduling service functions
const {
  findEligiblePilots,
  findEligibleCabinCrew,
  checkCrewSchedule,
  isCrewAvailable
} = require("../services/assignmentService");

const {
  submitJob,
  getStatus,
  cancelJob
} = require("../services/jobManager");

// Return only safe job details
const publicJob = (job) => ({
  jobId: job.jobId,
  status: job.status,
  startedAt: job.startedAt,
  completedAt: job.completedAt,
  result: job.result,
  error: job.error
});

// Submit a schedule job
const startScheduleJob = (req, res) => {
  try {
    const job = submitJob();

    return res.status(202).json({
      message: "Schedule generation job submitted",
      job: publicJob(job)
    });
  } catch (error) {
    const statusCode =
      error.message === "Generation in progress" ? 409 : 500;

    return res.status(statusCode).json({
      message: error.message
    });
  }
};

// Common error response
const handleError = (res, error, message) => {
  console.error(message, error);

  if (error.name === "CastError") {
    return res.status(400).json({
      message: "Invalid ID or data format",
      error: error.message
    });
  }

  if (error.name === "ValidationError") {
    return res.status(400).json({
      message: "Validation failed",
      error: error.message
    });
  }

  return res.status(500).json({
    message: "Internal server error",
    error: error.message
  });
};

// Validate availability periods
const validateAvailability = (availability) => {
  if (!Array.isArray(availability)) {
    return "Availability must be an array";
  }

  for (const period of availability) {
    if (!period || !period.startTime || !period.endTime) {
      return "Each availability period needs startTime and endTime";
    }

    const start = new Date(period.startTime);
    const end = new Date(period.endTime);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return "Invalid availability date";
    }

    if (end <= start) {
      return "End time must be after start time";
    }

    if (period.status !== "Available") {
      return 'Availability status must be "Available"';
    }
  }

  return null;
};

// ==========================================
// PILOT APIs
// ==========================================

// GET all pilots
router.get("/pilots", async (req, res) => {
  try {
    const pilots = await Pilot.find();
    res.status(200).json(pilots);
  } catch (error) {
    handleError(res, error, "Get pilots error:");
  }
});

// POST a new pilot
router.post("/pilots", async (req, res) => {
  try {
    const pilot = new Pilot(req.body);
    const savedPilot = await pilot.save();

    res.status(201).json({
      message: "Pilot added successfully",
      pilot: savedPilot
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Pilot already exists with this unique information"
      });
    }

    handleError(res, error, "Create pilot error:");
  }
});

// UPDATE pilot availability
router.put("/pilots/:id/availability", async (req, res) => {
  try {
    const { availability } = req.body;
    const validationError = validateAvailability(availability);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const pilot = await Pilot.findByIdAndUpdate(
      req.params.id,
      { availability },
      {
        new: true,
        runValidators: true
      }
    );

    if (!pilot) {
      return res.status(404).json({
        message: "Pilot not found"
      });
    }

    res.status(200).json({
      message: "Pilot availability updated successfully",
      pilot
    });
  } catch (error) {
    handleError(res, error, "Update pilot availability error:");
  }
});

// ==========================================
// CABIN CREW APIs
// ==========================================

// GET all cabin crew
router.get("/cabin-crew", async (req, res) => {
  try {
    const cabinCrew = await CabinCrew.find();
    res.status(200).json(cabinCrew);
  } catch (error) {
    handleError(res, error, "Get cabin crew error:");
  }
});

// POST a new cabin crew member
router.post("/cabin-crew", async (req, res) => {
  try {
    const cabinCrew = new CabinCrew(req.body);
    const savedCabinCrew = await cabinCrew.save();

    res.status(201).json({
      message: "Cabin crew added successfully",
      cabinCrew: savedCabinCrew
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Cabin crew member already exists"
      });
    }

    handleError(res, error, "Create cabin crew error:");
  }
});
// UPDATE cabin crew availability
router.put("/cabin-crew/:id/availability", async (req, res) => {
  try {
    const { availability } = req.body;
    const validationError = validateAvailability(availability);

    if (validationError) {
      return res.status(400).json({
        message: validationError
      });
    }

    const cabinCrew = await CabinCrew.findByIdAndUpdate(
      req.params.id,
      { availability },
      {
        new: true,
        runValidators: true
      }
    );

    if (!cabinCrew) {
      return res.status(404).json({
        message: "Cabin crew member not found"
      });
    }

    res.status(200).json({
      message: "Cabin crew availability updated successfully",
      cabinCrew
    });
  } catch (error) {
    handleError(res, error, "Update cabin crew availability error:");
  }
});

// ==========================================
// FLIGHT APIs
// ==========================================

// GET all flights
router.get("/flights", async (req, res) => {
  try {
    const flights = await Flight.find();
    res.status(200).json(flights);
  } catch (error) {
    handleError(res, error, "Get flights error:");
  }
});

// POST a new flight
router.post("/flights", async (req, res) => {
  try {
    const flight = new Flight(req.body);
    const savedFlight = await flight.save();

    res.status(201).json({
      message: "Flight added successfully",
      flight: savedFlight
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Flight number already exists"
      });
    }

    handleError(res, error, "Create flight error:");
  }
});

// ==========================================
// ASSIGNMENT APIs
// ==========================================

// GET all assignments
router.get("/assignments", async (req, res) => {
  try {
    const assignments = await Assignment.find()
      .populate("flightId");

    res.status(200).json(assignments);
  } catch (error) {
    handleError(res, error, "Get assignments error:");
  }
});

// POST a new assignment
router.post("/assignments", async (req, res) => {
  try {
    const {
      flightId,
      crewMemberId,
      crewType,
      assignedRole,
      assignmentStatus
    } = req.body;

    if (!flightId || !crewMemberId || !crewType || !assignedRole) {
      return res.status(400).json({
        message: "Please provide all required assignment details"
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(flightId) ||
      !mongoose.Types.ObjectId.isValid(crewMemberId)
    ) {
      return res.status(400).json({
        message: "Invalid flight ID or crew member ID"
      });
    }

    if (!["Pilot", "CabinCrew"].includes(crewType)) {
      return res.status(400).json({
        message: "Crew type must be Pilot or CabinCrew"
      });
    }

    const status = assignmentStatus || "Assigned";

    if (!["Assigned", "Completed", "Cancelled"].includes(status)) {
      return res.status(400).json({
        message: "Invalid assignment status"
      });
    }

    const flight = await Flight.findById(flightId);

    if (!flight) {
      return res.status(404).json({
        message: "Flight not found"
      });
    }

    if (flight.status === "Cancelled" && status !== "Cancelled") {
      return res.status(400).json({
        message: "Cannot assign crew to a cancelled flight"
      });
    }

    let crewMember;

    if (crewType === "Pilot") {
      crewMember = await Pilot.findById(crewMemberId);
    } else {
      crewMember = await CabinCrew.findById(crewMemberId);
    }

    if (!crewMember) {
      return res.status(404).json({
        message: "Crew member not found"
      });
    }

    // Check pilot requirements
    if (crewType === "Pilot") {
      if (crewMember.rank !== assignedRole) {
        return res.status(400).json({
          message: "Pilot rank does not match assigned role"
        });
      }

      if (
        !crewMember.isLicenseValid ||
        new Date(crewMember.licenseExpiryDate) <=
          new Date(flight.departureTime)
      ) {
        return res.status(400).json({
          message: "Pilot licence is invalid or expired"
        });
      }

      if (
        !crewMember.aircraftQualifications.includes(
          flight.aircraftType
        )
      ) {
        return res.status(400).json({
          message: "Pilot is not qualified for this aircraft"
        });
      }

      if (!flight.requiredPilotRanks.includes(assignedRole)) {
        return res.status(400).json({
          message: "This pilot role is not required for the flight"
        });
      }
    }

    // Check cabin crew requirements
    if (crewType === "CabinCrew") {
      const hasRequiredQualifications =
        flight.requiredCabinQualifications.every(
          (qualification) =>
            crewMember.qualifications.includes(qualification)
        );

      if (!hasRequiredQualifications) {
        return res.status(400).json({
          message: "Cabin crew member does not have all required qualifications"
        });
      }
    }

    // Check availability and schedule
    if (status !== "Cancelled") {
      const available = isCrewAvailable(crewMember, flight);

      if (!available) {
        return res.status(409).json({
          message: "Crew member is not available for the complete flight"
        });
      }

      await checkCrewSchedule({
        flightId,
        crewMemberId,
        crewType,
        assignmentStatus: status
      });
    }

    // Save assignment
    const assignment = new Assignment({
      flightId,
      crewMemberId,
      crewType,
      assignedRole,
      flightDepartureTime: flight.departureTime,
      flightArrivalTime: flight.arrivalTime,
      assignmentStatus: status
    });

    const savedAssignment = await assignment.save();

    res.status(201).json({
      message: "Crew assignment created successfully",
      assignment: savedAssignment
    });

  } catch (error) {
    console.error("Create assignment error:", error);

    if (
      error.message.includes("overlapping flight") ||
      error.message.includes("10 hours of rest")
    ) {
      return res.status(409).json({
        message: error.message
      });
    }

    if (error.message === "Flight not found") {
      return res.status(404).json({
        message: error.message
      });
    }

    handleError(res, error, "Assignment creation failed:");
  }
});
// ==========================================
// ELIGIBLE PILOT API
// ==========================================

// GET eligible pilots for a flight and role
router.get(
  "/eligible-pilots/:flightId/:requiredRole",
  async (req, res) => {
    try {
      const { flightId, requiredRole } = req.params;

      const pilots = await findEligiblePilots(
        flightId,
        requiredRole
      );

      res.status(200).json({
        message: "Eligible pilots found",
        count: pilots.length,
        pilots
      });
    } catch (error) {
      if (error.message === "Flight not found") {
        return res.status(404).json({
          message: error.message
        });
      }

      if (
        error.message === "This pilot role is not required for this flight"
      ) {
        return res.status(400).json({
          message: error.message
        });
      }

      handleError(res, error, "Find eligible pilots error:");
    }
  }
);

// ==========================================
// ELIGIBLE CABIN CREW API
// ==========================================

// GET eligible cabin crew for a flight
router.get(
  "/eligible-cabin-crew/:flightId",
  async (req, res) => {
    try {
      const { flightId } = req.params;

      const cabinCrew = await findEligibleCabinCrew(flightId);

      res.status(200).json({
        message: "Eligible cabin crew found",
        count: cabinCrew.length,
        cabinCrew
      });
    } catch (error) {
      if (error.message === "Flight not found") {
        return res.status(404).json({
          message: error.message
        });
      }

      handleError(res, error, "Find eligible cabin crew error:");
    }
  }
);

// ==========================================
// AUTOMATIC SCHEDULE GENERATION + OS JOB APIs
// ==========================================

// Generate schedule using OS job manager
router.post("/generate-schedule", startScheduleJob);

// Submit a scheduling job
router.post("/schedule-jobs", startScheduleJob);

// Get job status
router.get("/schedule-jobs/:jobId", (req, res) => {
  const job = getStatus(req.params.jobId);

  if (!job) {
    return res.status(404).json({
      message: "Schedule job not found"
    });
  }

  return res.status(200).json({
    job: publicJob(job)
  });
});

// Cancel a running job
router.delete("/schedule-jobs/:jobId", async (req, res) => {
  try {
    const job = await cancelJob(req.params.jobId);

    if (!job) {
      return res.status(404).json({
        message: "Schedule job not found"
      });
    }

    return res.status(200).json({
      message: "Schedule job cancellation requested",
      job: publicJob(job)
    });
  } catch (error) {
    console.error("Cancel schedule job error:", error);

    return res.status(500).json({
      message: "Could not cancel schedule job",
      error: error.message
    });
  }
});

// Export router
module.exports = router;