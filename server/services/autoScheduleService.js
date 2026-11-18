
const Flight = require("../models/Flight");
const Pilot = require("../models/Pilot");
const CabinCrew = require("../models/CabinCrew");
const Assignment = require("../models/Assignment");

const {
  findEligiblePilots,
  findEligibleCabinCrew,
  checkCrewSchedule
} = require("./assignmentService");

const generateSchedule = async () => {
  const createdAssignmentIds = [];

  try {
    // 1. Get all scheduled flights in departure order
    const flights = await Flight.find({
      status: "Scheduled"
    }).sort({ departureTime: 1 });

    if (flights.length === 0) {
      return {
        message: "No scheduled flights found",
        assignmentsCreated: 0
      };
    }

    // 2. Process each flight
    for (const flight of flights) {
      const existingAssignments = await Assignment.find({
        flightId: flight._id,
        assignmentStatus: { $ne: "Cancelled" }
      });

      const assignedPilotRoles = existingAssignments
        .filter((a) => a.crewType === "Pilot")
        .map((a) => a.assignedRole);

      const assignedCabinCount = existingAssignments.filter(
        (a) => a.crewType === "CabinCrew"
      ).length;

      const usedCrewIds = new Set(
        existingAssignments.map((a) => a.crewMemberId.toString())
      );

      // 3. Validate pilot requirements
      if (
        flight.requiredPilotRanks.length !== flight.requiredPilots
      ) {
        throw new Error(
          `Flight ${flight.flightNumber}: required pilot count does not match required pilot ranks`
        );
      }

      // 4. Assign missing pilot roles
      for (const role of flight.requiredPilotRanks) {
        if (assignedPilotRoles.includes(role)) {
          continue;
        }

        const eligiblePilots = await findEligiblePilots(
          flight._id,
          role
        );

        let selectedPilot = null;

        for (const pilot of eligiblePilots) {
          if (usedCrewIds.has(pilot._id.toString())) {
            continue;
          }

          try {
            await checkCrewSchedule({
              flightId: flight._id,
              crewMemberId: pilot._id,
              crewType: "Pilot",
              assignmentStatus: "Assigned"
            });

            selectedPilot = pilot;
            break;
          } catch (error) {
            // Try another eligible pilot
          }
        }

        if (!selectedPilot) {
          throw new Error(
            `No available ${role} found for flight ${flight.flightNumber}`
          );
        }

        const assignment = await Assignment.create({
          flightId: flight._id,
          crewMemberId: selectedPilot._id,
          crewType: "Pilot",
          assignedRole: role,
          flightDepartureTime: flight.departureTime,
          flightArrivalTime: flight.arrivalTime,
          assignmentStatus: "Assigned"
        });

        createdAssignmentIds.push(assignment._id);
        usedCrewIds.add(selectedPilot._id.toString());
        assignedPilotRoles.push(role);
      }

      // 5. Assign missing cabin crew
      const cabinCrewNeeded =
        flight.requiredCabinCrew - assignedCabinCount;

      if (cabinCrewNeeded < 0) {
        throw new Error(
          `Flight ${flight.flightNumber} already has more cabin crew than required`
        );
      }

      if (cabinCrewNeeded > 0) {
        const eligibleCrew = await findEligibleCabinCrew(flight._id);
        let assignedNow = 0;

        for (const member of eligibleCrew) {
          if (assignedNow >= cabinCrewNeeded) {
            break;
          }

          if (usedCrewIds.has(member._id.toString())) {
            continue;
          }

          try {
            await checkCrewSchedule({
              flightId: flight._id,
              crewMemberId: member._id,
              crewType: "CabinCrew",
              assignmentStatus: "Assigned"
            });
          } catch (error) {
            continue;
          }

          const assignment = await Assignment.create({
            flightId: flight._id,
            crewMemberId: member._id,
            crewType: "CabinCrew",
            assignedRole: "Cabin Crew",
            flightDepartureTime: flight.departureTime,
            flightArrivalTime: flight.arrivalTime,
            assignmentStatus: "Assigned"
          });

          createdAssignmentIds.push(assignment._id);
          usedCrewIds.add(member._id.toString());
          assignedNow++;
        }

        if (assignedNow < cabinCrewNeeded) {
          throw new Error(
            `Not enough eligible cabin crew for flight ${flight.flightNumber}`
          );
        }
      }
    }

    return {
      message: "Automatic schedule generated successfully",
      flightsProcessed: flights.length,
      assignmentsCreated: createdAssignmentIds.length
    };

  } catch (error) {
    // Remove assignments created during this failed run
    if (createdAssignmentIds.length > 0) {
      await Assignment.deleteMany({
        _id: { $in: createdAssignmentIds }
      });
    }

    throw error;
  }
};

module.exports = { generateSchedule };
