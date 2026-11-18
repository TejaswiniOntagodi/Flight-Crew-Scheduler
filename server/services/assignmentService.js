
const Pilot = require("../models/Pilot");
const Flight = require("../models/Flight");
const Assignment = require("../models/Assignment");
const CabinCrew = require("../models/CabinCrew");

// ==========================================
// CHECK CREW AVAILABILITY
// ==========================================

const isCrewAvailable = (crewMember, flight) => {
  if (
    !crewMember.availability ||
    crewMember.availability.length === 0
  ) {
    return false;
  }

  return crewMember.availability.some((period) => {
    return (
      period.status === "Available" &&
      new Date(period.startTime) <= new Date(flight.departureTime) &&
      new Date(period.endTime) >= new Date(flight.arrivalTime)
    );
  });
};

// ==========================================
// FIND ELIGIBLE PILOTS
// ==========================================

const findEligiblePilots = async (flightId, requiredRole) => {
  const flight = await Flight.findById(flightId);

  if (!flight) {
    throw new Error("Flight not found");
  }

  if (!flight.requiredPilotRanks.includes(requiredRole)) {
    throw new Error(
      "This pilot role is not required for this flight"
    );
  }

  const pilots = await Pilot.find();

  const eligiblePilots = pilots.filter((pilot) => {
    const validLicense =
      pilot.isLicenseValid &&
      new Date(pilot.licenseExpiryDate) >
        new Date(flight.departureTime);

    const qualifiedAircraft =
      pilot.aircraftQualifications.includes(
        flight.aircraftType
      );

    const correctRank = pilot.rank === requiredRole;

    const available = isCrewAvailable(pilot, flight);

    return (
      validLicense &&
      qualifiedAircraft &&
      correctRank &&
      available
    );
  });

  return eligiblePilots;
};

// ==========================================
// FIND ELIGIBLE CABIN CREW
// ==========================================

const findEligibleCabinCrew = async (flightId) => {
  const flight = await Flight.findById(flightId);

  if (!flight) {
    throw new Error("Flight not found");
  }

  const cabinCrewMembers = await CabinCrew.find();

  const eligibleCabinCrew = cabinCrewMembers.filter((member) => {
    const hasRequiredQualifications =
      flight.requiredCabinQualifications.every(
        (qualification) =>
          member.qualifications.includes(qualification)
      );

    const available = isCrewAvailable(member, flight);

    return hasRequiredQualifications && available;
  });

  return eligibleCabinCrew;
};

// ==========================================
// CHECK OVERLAPPING FLIGHTS AND 10-HOUR REST
// ==========================================

const checkCrewSchedule = async ({
  flightId,
  crewMemberId,
  crewType,
  assignmentStatus
}) => {
  const flight = await Flight.findById(flightId);

  if (!flight) {
    throw new Error("Flight not found");
  }

  // Cancelled assignments do not create schedule conflicts
  if (assignmentStatus === "Cancelled") {
    return true;
  }

  const newDeparture = new Date(
    flight.departureTime
  ).getTime();

  const newArrival = new Date(
    flight.arrivalTime
  ).getTime();

  const minimumRest = 10 * 60 * 60 * 1000;

  const existingAssignments = await Assignment.find({
    crewMemberId,
    crewType,
    assignmentStatus: { $ne: "Cancelled" }
  });

  for (const assignment of existingAssignments) {
    const oldDeparture = new Date(
      assignment.flightDepartureTime
    ).getTime();

    const oldArrival = new Date(
      assignment.flightArrivalTime
    ).getTime();

    // Check overlapping flights
    const hasOverlap =
      oldDeparture < newArrival &&
      oldArrival > newDeparture;

    if (hasOverlap) {
      throw new Error(
        "Crew member already has an overlapping flight"
      );
    }

    // Check rest after an earlier flight
    if (
      oldArrival <= newDeparture &&
      newDeparture - oldArrival < minimumRest
    ) {
      throw new Error(
        "Crew member needs at least 10 hours of rest"
      );
    }

    // Check rest before a later flight
    if (
      newArrival <= oldDeparture &&
      oldDeparture - newArrival < minimumRest
    ) {
      throw new Error(
        "Crew member needs at least 10 hours of rest"
      );
    }
  }

  return true;
};

// ==========================================
// EXPORT ALL FUNCTIONS
// ==========================================

module.exports = {
  isCrewAvailable,
  findEligiblePilots,
  findEligibleCabinCrew,
  checkCrewSchedule
};
