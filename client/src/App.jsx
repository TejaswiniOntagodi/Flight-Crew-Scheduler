
import { useEffect, useState } from "react";

import {
  LayoutDashboard,
  Users,
  UserRound,
  Plane,
  CalendarDays,
  ClipboardList,
  Settings,
  Bell,
  Search,
  ArrowUpRight,
  CheckCircle,
  AlertCircle
} from "lucide-react";

import "./App.css";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");

  const [stats, setStats] = useState({
    pilots: 0,
    cabinCrew: 0,
    flights: 0,
    assignments: 0
  });

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState("");

  const [pilots, setPilots] = useState([]);
  const [cabinCrew, setCabinCrew] = useState([]);
  const [flights, setFlights] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Fetch backend data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setApiError("");

        const endpoints = [
          "pilots",
          "cabin-crew",
          "flights",
          "assignments"
        ];

        const responses = await Promise.all(
          endpoints.map(endpoint =>
            fetch(`http://localhost:5000/api/${endpoint}`)
          )
        );

        const results = await Promise.all(
          responses.map(response => {
            if (!response.ok) {
              throw new Error("Unable to fetch backend data");
            }
            return response.json();
          })
        );

        const pilotData = Array.isArray(results[0]) ? results[0] : [];
        const cabinData = Array.isArray(results[1]) ? results[1] : [];
        const flightData = Array.isArray(results[2]) ? results[2] : [];
        const assignmentData = Array.isArray(results[3]) ? results[3] : [];

        setPilots(pilotData);
        setCabinCrew(cabinData);
        setFlights(flightData);
        setAssignments(assignmentData);

        setStats({
          pilots: pilotData.length,
          cabinCrew: cabinData.length,
          flights: flightData.length,
          assignments: assignmentData.length
        });

      } catch (error) {
        console.error("Dashboard API Error:", error);
        setApiError(
          "Unable to connect to backend. Please check the server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sidebar menu
  const menuItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Pilots", icon: UserRound },
    { name: "Cabin Crew", icon: Users },
    { name: "Flights", icon: Plane },
    { name: "Assignments", icon: ClipboardList },
    { name: "Schedule", icon: CalendarDays }
  ];

  // Table styles
  const tableHeaderStyle = {
    padding: "12px",
    textAlign: "left",
    borderBottom: "1px solid #ddd",
    whiteSpace: "nowrap"
  };

  const tableCellStyle = {
    padding: "12px",
    borderBottom: "1px solid #eee",
    verticalAlign: "middle"
  };

  // Format date and time
  const formatDateTime = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) return "-";

    return parsedDate.toLocaleString("en-IN");
  };

  // Find crew member name
  const getCrewMemberName = (assignment) => {
    const crewId = String(assignment.crewMemberId || "");

    if (assignment.crewType === "Pilot") {
      const pilot = pilots.find(
        person => String(person._id) === crewId
      );

      return pilot?.name || pilot?.fullName || pilot?.employeeId || "Pilot";
    }

    const member = cabinCrew.find(
      person => String(person._id) === crewId
    );

    return member?.name || member?.fullName || member?.employeeId || "Cabin Crew";
  };

  // Active assignments
  const activeAssignments = assignments.filter(
    assignment => assignment.assignmentStatus === "Assigned"
  );

  // Unique assigned crew members
  const assignedPilots = new Set(
    activeAssignments
      .filter(assignment => assignment.crewType === "Pilot")
      .map(assignment => String(assignment.crewMemberId))
  );

  const assignedCabinCrew = new Set(
    activeAssignments
      .filter(assignment => assignment.crewType === "CabinCrew")
      .map(assignment => String(assignment.crewMemberId))
  );

  const pilotAssignedCount = assignedPilots.size;
  const cabinAssignedCount = assignedCabinCrew.size;

  const availablePilots = Math.max(
    0,
    pilots.length - pilotAssignedCount
  );

  const availableCabinCrew = Math.max(
    0,
    cabinCrew.length - cabinAssignedCount
  );

  // Detect overlapping flight assignments
  const findSchedulingConflicts = () => {
    const conflicts = [];

    for (let i = 0; i < activeAssignments.length; i++) {
      for (let j = i + 1; j < activeAssignments.length; j++) {
        const first = activeAssignments[i];
        const second = activeAssignments[j];

        const sameCrew =
          String(first.crewMemberId) === String(second.crewMemberId) &&
          first.crewType === second.crewType;

        if (!sameCrew) continue;

        const firstStart = new Date(first.flightDepartureTime).getTime();
        const firstEnd = new Date(first.flightArrivalTime).getTime();
        const secondStart = new Date(second.flightDepartureTime).getTime();
        const secondEnd = new Date(second.flightArrivalTime).getTime();

        const validTimes = [
          firstStart,
          firstEnd,
          secondStart,
          secondEnd
        ].every(Number.isFinite);

        if (!validTimes) continue;

        if (firstStart < secondEnd && secondStart < firstEnd) {
          conflicts.push({
            crewName: getCrewMemberName(first),
            crewType: first.crewType,
            firstFlight: first.flightId?.flightNumber || "Unknown",
            secondFlight: second.flightId?.flightNumber || "Unknown"
          });
        }
      }
    }

    return conflicts;
  };

  const schedulingConflicts = findSchedulingConflicts();

  // Reusable table for Pilots, Cabin Crew and Flights
  const renderTable = (title, data) => {
    if (loading) {
      return (
        <div className="panel">
          <p>Loading data...</p>
        </div>
      );
    }

    if (data.length === 0) {
      return (
        <div className="panel">
          <h3>{title}</h3>
          <p>No records found.</p>
        </div>
      );
    }

    const hiddenFields = ["__v", "_id"];

    return (
      <div className="panel">
        <h3>{title}</h3>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px"
          }}>
            <thead>
              <tr>
                {Object.keys(data[0])
                  .filter(key => !hiddenFields.includes(key))
                  .map(key => (
                    <th key={key} style={tableHeaderStyle}>
                      {key}
                    </th>
                  ))}
              </tr>
            </thead>

            <tbody>
              {data.map((item, index) => (
                <tr key={item._id || index}>
                  {Object.entries(item)
                    .filter(([key]) => !hiddenFields.includes(key))
                    .map(([key, value]) => (
                      <td key={key} style={tableCellStyle}>
                        {value && typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value ?? "-")}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Improved Assignments table
  const renderAssignments = () => {
    if (loading) {
      return (
        <div className="panel">
          <p>Loading assignments...</p>
        </div>
      );
    }

    if (assignments.length === 0) {
      return (
        <div className="panel">
          <h3>Crew Assignments</h3>
          <p>No assignment records found.</p>
        </div>
      );
    }

    return (
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Crew Assignments</h3>
            <p>View crew members assigned to each flight</p>
          </div>

          <ClipboardList size={24} />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px"
          }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Flight Number</th>
                <th style={tableHeaderStyle}>Route</th>
                <th style={tableHeaderStyle}>Crew Member</th>
                <th style={tableHeaderStyle}>Crew Type</th>
                <th style={tableHeaderStyle}>Assigned Role</th>
                <th style={tableHeaderStyle}>Departure</th>
                <th style={tableHeaderStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {assignments.map((assignment, index) => (
                <tr key={assignment._id || index}>
                  <td style={tableCellStyle}>
                    <strong>
                      {assignment.flightId?.flightNumber || "-"}
                    </strong>
                  </td>

                  <td style={tableCellStyle}>
                    {assignment.flightId?.source || "-"} →{" "}
                    {assignment.flightId?.destination || "-"}
                  </td>

                  <td style={tableCellStyle}>
                    {getCrewMemberName(assignment)}
                  </td>

                  <td style={tableCellStyle}>
                    {assignment.crewType === "CabinCrew"
                      ? "Cabin Crew"
                      : assignment.crewType || "-"}
                  </td>

                  <td style={tableCellStyle}>
                    {assignment.assignedRole || "-"}
                  </td>

                  <td style={tableCellStyle}>
                    {formatDateTime(assignment.flightDepartureTime)}
                  </td>

                  <td style={tableCellStyle}>
                    <span style={{
                      display: "inline-block",
                      padding: "5px 10px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      background:
                        assignment.assignmentStatus === "Assigned"
                          ? "#e6f7ed"
                          : assignment.assignmentStatus === "Cancelled"
                          ? "#fdeaea"
                          : "#f0f0f0",
                      color:
                        assignment.assignmentStatus === "Assigned"
                          ? "#16834a"
                          : assignment.assignmentStatus === "Cancelled"
                          ? "#c62828"
                          : "#555"
                    }}>
                      {assignment.assignmentStatus || "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Dashboard Flight Overview
  const renderFlightOverview = () => {
    if (loading) return <p>Loading flight information...</p>;

    if (flights.length === 0) {
      return (
        <div className="empty-state">
          <Plane size={35} />
          <h3>No flights available</h3>
          <p>Flight records will appear here when available.</p>
        </div>
      );
    }

    const overviewFlights = [...flights].sort(
      (a, b) =>
        new Date(a.departureTime || 0) -
        new Date(b.departureTime || 0)
    );

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "15px"
        }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Flight</th>
              <th style={tableHeaderStyle}>Route</th>
              <th style={tableHeaderStyle}>Departure</th>
              <th style={tableHeaderStyle}>Aircraft</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {overviewFlights.map((flight, index) => (
              <tr key={flight._id || index}>
                <td style={tableCellStyle}>
                  <strong>{flight.flightNumber || "-"}</strong>
                </td>

                <td style={tableCellStyle}>
                  {flight.source || "-"} → {flight.destination || "-"}
                </td>

                <td style={tableCellStyle}>
                  {formatDateTime(flight.departureTime)}
                </td>

                <td style={tableCellStyle}>
                  {flight.aircraftType || "-"}
                </td>

                <td style={tableCellStyle}>
                  {flight.status || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          className="view-button"
          onClick={() => setActivePage("Flights")}
          style={{ marginTop: "15px" }}
        >
          View all flights <ArrowUpRight size={16} />
        </button>
      </div>
    );
  };

  // Crew Availability
  const renderCrewAvailability = () => {
    if (loading) return <p>Loading crew availability...</p>;

    return (
      <div className="status-list">
        <div>
          <CheckCircle className="success" />
          <span>Pilots without active assignments</span>
          <strong>{availablePilots} / {pilots.length}</strong>
        </div>

        <div>
          <Users className="success" />
          <span>Pilots with active assignments</span>
          <strong>{pilotAssignedCount} / {pilots.length}</strong>
        </div>

        <div>
          <CheckCircle className="success" />
          <span>Cabin crew without active assignments</span>
          <strong>{availableCabinCrew} / {cabinCrew.length}</strong>
        </div>

        <div>
          <Users className="success" />
          <span>Cabin crew with active assignments</span>
          <strong>{cabinAssignedCount} / {cabinCrew.length}</strong>
        </div>

        <div>
          {schedulingConflicts.length === 0
            ? <CheckCircle className="success" />
            : <AlertCircle className="danger" />}

          <span>Scheduling conflicts</span>

          <strong style={{
            color: schedulingConflicts.length === 0 ? "green" : "red"
          }}>
            {schedulingConflicts.length}
          </strong>
        </div>

        <p style={{
          fontSize: "12px",
          color: "#777",
          marginTop: "12px"
        }}>
          Crew counts are based on active assignment records.
          Flight-time overlap checks do not calculate mandatory rest periods.
        </p>

        {schedulingConflicts.length > 0 && (
          <div style={{ marginTop: "12px" }}>
            <h4>Detected Conflicts</h4>

            {schedulingConflicts.map((conflict, index) => (
              <div key={index} style={{
                padding: "10px",
                marginTop: "8px",
                borderRadius: "8px",
                background: "#fff1f1"
              }}>
                <strong>{conflict.crewName}</strong>
                <p>{conflict.crewType}</p>
                <p>
                  {conflict.firstFlight} overlaps with {conflict.secondFlight}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Flight Schedule
  const renderSchedule = () => {
    if (loading) {
      return (
        <div className="panel">
          <p>Loading schedule...</p>
        </div>
      );
    }

    if (flights.length === 0) {
      return (
        <div className="panel">
          <h3>Flight Schedule</h3>
          <p>No scheduled flights found.</p>
        </div>
      );
    }

    // Flight status colors
    const getFlightStatusStyle = (status) => {
      const normalizedStatus = String(status || "").toLowerCase();

      if (normalizedStatus === "scheduled") {
        return {
          background: "#e6f7ed",
          color: "#16834a"
        };
      }

      if (normalizedStatus === "completed") {
        return {
          background: "#e6f0ff",
          color: "#245bb5"
        };
      }

      if (normalizedStatus === "in progress") {
        return {
          background: "#fff3df",
          color: "#b36b00"
        };
      }

      if (normalizedStatus === "cancelled") {
        return {
          background: "#fdeaea",
          color: "#c62828"
        };
      }

      return {
        background: "#f0f0f0",
        color: "#555"
      };
    };

    return (
      <div className="panel">
        <div className="panel-heading">
          <div>
            <h3>Flight Schedule</h3>
            <p>All scheduled flights from your database</p>
          </div>

          <CalendarDays size={24} />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "20px"
          }}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Flight Number</th>
                <th style={tableHeaderStyle}>From</th>
                <th style={tableHeaderStyle}>To</th>
                <th style={tableHeaderStyle}>Departure Date & Time</th>
                <th style={tableHeaderStyle}>Arrival Date & Time</th>
                <th style={tableHeaderStyle}>Aircraft</th>
                <th style={tableHeaderStyle}>Status</th>
              </tr>
            </thead>

            <tbody>
              {flights.map((flight, index) => (
                <tr key={flight._id || index}>
                  <td style={tableCellStyle}>
                    <strong>{flight.flightNumber || "-"}</strong>
                  </td>

                  <td style={tableCellStyle}>
                    {flight.source || "-"}
                  </td>

                  <td style={tableCellStyle}>
                    {flight.destination || "-"}
                  </td>

                  <td style={tableCellStyle}>
                    {formatDateTime(flight.departureTime)}
                  </td>

                  <td style={tableCellStyle}>
                    {formatDateTime(flight.arrivalTime)}
                  </td>

                  <td style={tableCellStyle}>
                    {flight.aircraftType || "-"}
                  </td>

                  <td style={tableCellStyle}>
                    <span style={{
                      display: "inline-block",
                      padding: "5px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: "600",
                      whiteSpace: "nowrap",
                      ...getFlightStatusStyle(flight.status)
                    }}>
                      {flight.status || "Unknown"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Recent Assignments on Dashboard
  const renderRecentAssignments = () => {
    if (loading) return <p>Loading assignments...</p>;

    if (assignments.length === 0) {
      return <p>No assignment records found.</p>;
    }

    const recentAssignments = [...assignments]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )
      .slice(0, 5);

    return (
      <div style={{ overflowX: "auto" }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "15px"
        }}>
          <thead>
            <tr>
              <th style={tableHeaderStyle}>Flight</th>
              <th style={tableHeaderStyle}>Crew Member</th>
              <th style={tableHeaderStyle}>Crew Type</th>
              <th style={tableHeaderStyle}>Assigned Role</th>
              <th style={tableHeaderStyle}>Departure</th>
              <th style={tableHeaderStyle}>Status</th>
            </tr>
          </thead>

          <tbody>
            {recentAssignments.map((assignment, index) => (
              <tr key={assignment._id || index}>
                <td style={tableCellStyle}>
                  {assignment.flightId?.flightNumber || "-"}
                </td>

                <td style={tableCellStyle}>
                  {getCrewMemberName(assignment)}
                </td>

                <td style={tableCellStyle}>
                  {assignment.crewType === "CabinCrew"
                    ? "Cabin Crew"
                    : assignment.crewType || "-"}
                </td>

                <td style={tableCellStyle}>
                  {assignment.assignedRole || "-"}
                </td>

                <td style={tableCellStyle}>
                  {formatDateTime(assignment.flightDepartureTime)}
                </td>

                <td style={tableCellStyle}>
                  {assignment.assignmentStatus || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Page navigation
  const renderPage = () => {
    switch (activePage) {
      case "Pilots":
        return renderTable("Pilots Management", pilots);

      case "Cabin Crew":
        return renderTable("Cabin Crew Management", cabinCrew);

      case "Flights":
        return renderTable("Flight Management", flights);

      case "Assignments":
        return renderAssignments();

      case "Schedule":
        return renderSchedule();

      default:
        return (
          <>
            <div className="welcome">
              <div>
                <h1>Welcome to SkyCrew 👋</h1>
                <p>Here's an overview of your flight operations.</p>
              </div>

              <div className="date-label">
                <CalendarDays size={17} />
                Flight Operations Dashboard
              </div>
            </div>

            <div className="stats-grid">
              <StatCard
                title="Total Pilots"
                value={loading ? "..." : stats.pilots}
                icon={<UserRound />}
                color="blue"
                note="Registered pilots"
              />

              <StatCard
                title="Cabin Crew"
                value={loading ? "..." : stats.cabinCrew}
                icon={<Users />}
                color="purple"
                note="Registered crew members"
              />

              <StatCard
                title="Total Flights"
                value={loading ? "..." : stats.flights}
                icon={<Plane />}
                color="orange"
                note="Available flight records"
              />

              <StatCard
                title="Assignments"
                value={loading ? "..." : stats.assignments}
                icon={<ClipboardList />}
                color="green"
                note="Crew assignment records"
              />
            </div>

            {apiError && (
              <div className="panel">
                <p style={{ color: "red" }}>{apiError}</p>
              </div>
            )}

            <div className="section-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Flight Management</h3>
                    <p>Manage and monitor your flights</p>
                  </div>

                  <Plane size={22} />
                </div>

                {renderFlightOverview()}
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Crew Availability</h3>
                    <p>Monitor your crew status</p>
                  </div>

                  <Users size={22} />
                </div>

                {renderCrewAvailability()}
              </div>
            </div>

            <div className="panel recent-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Assignments</h3>
                  <p>Latest crew allocation records</p>
                </div>

                <button
                  className="view-button"
                  onClick={() => setActivePage("Assignments")}
                >
                  View all <ArrowUpRight size={16} />
                </button>
              </div>

              {renderRecentAssignments()}
            </div>
          </>
        );
    }
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <Plane size={27} />

          <div>
            <h2>SkyCrew</h2>
            <span>Flight Management</span>
          </div>
        </div>

        <p className="menu-label">MAIN MENU</p>

        <nav>
          {menuItems.map(item => {
            const Icon = item.icon;

            return (
              <div
                className={`nav-item ${
                  activePage === item.name ? "active" : ""
                }`}
                key={item.name}
                onClick={() => setActivePage(item.name)}
                style={{ cursor: "pointer" }}
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          <Settings size={19} />
          <span>Settings</span>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h2>
              {activePage === "Dashboard"
                ? "Flight Operations"
                : activePage}
            </h2>

            <p>Manage your airline crew and flight schedules</p>
          </div>

          <div className="top-actions">
            <button className="icon-button">
              <Search size={19} />
            </button>

            <button className="icon-button">
              <Bell size={19} />
            </button>

            <div className="profile">
              <div className="avatar">A</div>

              <div>
                <strong>Administrator</strong>
                <small>Operations Manager</small>
              </div>
            </div>
          </div>
        </header>

        <section className="content">
          {renderPage()}
        </section>
      </main>
    </div>
  );
}

// Statistics Card
function StatCard({ title, value, icon, color, note }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>
        {icon}
      </div>

      <p>{title}</p>
      <h2>{value}</h2>
      <small>{note}</small>
    </div>
  );
}

export default App;
