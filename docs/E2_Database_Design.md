# FLIGHT CREW SCHEDULER
## E2 – Scheduling Data Engine
### Database Design and Architecture Document

**Project Type:** Mini Project  
**Module:** E2 – Scheduling Data Engine  
**Database:** MongoDB  
**Backend:** Node.js and Express.js  
**ODM:** Mongoose  
**API Testing:** Postman  
**Version:** 1.0 – Initial Design Draft

---

## 1. Introduction

The Flight Crew Scheduler is a system designed to help airlines manage flight schedules and crew assignments.

The Scheduling Data Engine (E2) is responsible for managing and maintaining the project's database.

It stores flight information, pilot information, cabin crew information, aircraft information, assignments, schedules and scheduling job details.

It provides structured data to the other engines through backend APIs.

## 2. Objectives

The main objectives of E2 are:

1. Create and maintain a centralized MongoDB database.
2. Store flight, pilot, cabin crew and aircraft information.
3. Maintain crew availability and qualifications.
4. Store crew-to-flight assignment records.
5. Maintain scheduling information.
6. Provide REST APIs for database operations.
7. Validate incoming data before storing it.
8. Support integration with the other project engines.

## 3. Technology Stack

| Technology | Purpose |
|---|---|
| Node.js | Backend JavaScript runtime |
| Express.js | REST API development |
| MongoDB | NoSQL database |
| Mongoose | Database schema and validation |
| JavaScript | Backend programming |
| Postman | API testing |
| GitHub | Version control and collaboration |
| VS Code | Development environment |

## 4. Database Design

The project uses MongoDB as its database.

Database name: `flight_crew_scheduler`

The planned collections are:

| No. | Collection | Purpose |
|---|---|---|
| 1 | users | Store application user information |
| 2 | flights | Store flight information |
| 3 | pilots | Store pilot information |
| 4 | cabincrew | Store cabin crew information |
| 5 | aircraft | Store aircraft information |
| 6 | assignments | Store crew-to-flight assignments |
| 7 | schedules | Store generated or managed schedules |
| 8 | schedulingjobs | Store scheduling job information |

## 5. Collection Design

### 5.1 Users Collection

Purpose: Store application users and their roles.

Proposed fields:
- name
- email
- passwordHash
- role
- createdAt
- updatedAt

Possible roles: Admin, Scheduler and Viewer.

### 5.2 Flights Collection

Purpose: Store flight details.

Fields:
- flightNumber
- source
- destination
- departureTime
- arrivalTime
- aircraftType
- requiredPilots
- requiredPilotRanks
- requiredCabinCrew
- requiredCabinQualifications
- status

### 5.3 Pilots Collection

Purpose: Store pilot information and qualifications.

Fields:
- employeeId
- name
- email
- licenseNumber
- isLicenseValid
- licenseExpiryDate
- rank
- aircraftQualifications
- isAvailable
- availability

### 5.4 CabinCrew Collection

Purpose: Store cabin crew information and qualifications.

Fields:
- employeeId
- name
- email
- phone
- qualifications
- isAvailable
- availability

### 5.5 Aircraft Collection

Purpose: Store aircraft information.

Proposed fields:
- aircraftId
- registrationNumber
- aircraftType
- capacity
- status

### 5.6 Assignments Collection

Purpose: Maintain records of crew assigned to flights.

Fields:
- flightId
- crewMemberId
- crewType
- assignedRole
- flightDepartureTime
- flightArrivalTime
- assignmentStatus

The flightId field references the Flights collection. The crewMemberId field references either the Pilots or CabinCrew collection, depending on crewType.

### 5.7 Schedules Collection

Purpose: Store scheduling information.

Proposed fields:
- scheduleName
- startDate
- endDate
- flightIds
- scheduleStatus
- createdAt
- updatedAt

### 5.8 SchedulingJobs Collection

Purpose: Maintain records of scheduling operations.

Proposed fields:
- jobName
- scheduleId
- jobStatus
- startedAt
- completedAt
- resultSummary

These three collections' detailed fields will be finalized during coordination with E3 and the rest of the team.

## 6. Crew Availability Management

Both Pilots and CabinCrew collections will contain an availability array.

Each availability entry contains:

- startTime
- endTime
- status

The system can use these records to identify when crew members are available or unavailable.

## 7. Data Validation

The database will use Mongoose validation.

Examples:

- Employee ID must be unique.
- Flight number must be unique.
- Email must be valid.
- Required fields cannot be empty.
- Pilot rank must be Captain or First Officer.
- Assignment status must be a valid status.
- Flight arrival time must be later than departure time.
- Availability end time must be later than availability start time.

## 8. API Design

The E2 module will provide REST APIs for managing database records.

Proposed endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/flights | Add flight |
| GET | /api/flights | View all flights |
| GET | /api/flights/:id | View one flight |
| PUT | /api/flights/:id | Update flight |
| DELETE | /api/flights/:id | Delete flight |
| POST | /api/pilots | Add pilot |
| GET | /api/pilots | View pilots |
| POST | /api/cabincrew | Add cabin crew |
| GET | /api/cabincrew | View cabin crew |
| POST | /api/assignments | Save assignment |
| GET | /api/assignments | View assignments |

Additional endpoints will be planned for aircraft, schedules and scheduling jobs.

## 9. Integration with Other Engines

E2 provides data access and persistence to the other project modules.

- E1 obtains flight, pilot and cabin crew information through E2.
- E1 saves successful crew assignments through E2.
- E3 accesses schedules and assignment records.
- E4 uses E2 APIs to display and manage project information.

The engine interfaces and ownership rules will be agreed upon by the team before final integration.

## 10. Security Plan

The database module will follow these security practices:

1. Store configuration and database credentials in environment variables.
2. Exclude `.env` files from GitHub.
3. Validate user input.
4. Use password hashing for user passwords.
5. Apply authentication and role-based authorization to protected APIs.
6. Avoid exposing database error details or credentials in API responses.
7. Use fictional information for development and testing.

## 11. Testing Strategy

The following tests are planned:

1. Verify MongoDB connection.
2. Test flight creation and retrieval.
3. Test pilot creation and retrieval.
4. Test cabin crew creation and retrieval.
5. Test invalid and missing fields.
6. Test unique employee IDs and flight numbers.
7. Test assignment creation and retrieval.
8. Test API responses using Postman.

Integration testing will verify communication between E1, E2, E3 and E4.

## 12. GitHub and Version Control

The team uses a shared GitHub repository.

Repository: Flight-Crew-Scheduler

E2 branch: `feature/database-setup`

All E2 changes will be committed and pushed to the assigned branch. Integration into the main branch will happen through the team's agreed review process.

## 13. Expected Outcome

The expected outcome of E2 is a functional database management module that stores and provides accurate scheduling information through REST APIs.

It will support crew assignment, schedule management and integration with the remaining project engines.

## 14. Conclusion

The Scheduling Data Engine provides the database foundation for the Flight Crew Scheduler. A properly designed database, validated data structures and reliable APIs will make the overall system easier to develop, test and integrate.
flowchart TB
    U[Users / Admin / Scheduler]

    E4[E4 - Scheduling Application Engine]
    E1[E1 - Crew Assignment Engine]
    E3[E3 - Execution Management Engine]

    API[Express.js REST API]
    CTRL[Controllers and Validation]
    E2[E2 - Scheduling Data Engine]
    M[Mongoose Models]

    DB[(MongoDB<br/>flight_crew_scheduler)]

    U --> E4
    E4 --> API
    E1 <--> API
    E3 <--> API

    API --> CTRL
    CTRL --> E2
    E2 --> M
    M --> DB

    DB --> M
    M --> E2
    E2 --> CTRL
    CTRL --> API

erDiagram
    USERS {
        ObjectId _id PK
        string name
        string email
        string passwordHash
        string role
    }

    FLIGHTS {
        ObjectId _id PK
        string flightNumber
        string source
        string destination
        date departureTime
        date arrivalTime
        string aircraftType
        number requiredPilots
        number requiredCabinCrew
    }

    PILOTS {
        ObjectId _id PK
        string employeeId
        string licenseNumber
        boolean isLicenseValid
        date licenseExpiryDate
        string rank
        boolean isAvailable
    }

    CABINCREW {
        ObjectId _id PK
        string employeeId
        string name
        boolean isAvailable
    }

    AIRCRAFT {
        ObjectId _id PK
        string aircraftId
        string registrationNumber
        string aircraftType
        number capacity
        string status
    }

    ASSIGNMENTS {
        ObjectId _id PK
        ObjectId flightId FK
        ObjectId crewMemberId
        string crewType
        string assignedRole
        date flightDepartureTime
        date flightArrivalTime
        string assignmentStatus
    }

    SCHEDULES {
        ObjectId _id PK
        string scheduleName
        date startDate
        date endDate
        string scheduleStatus
    }

    SCHEDULINGJOBS {
        ObjectId _id PK
        ObjectId scheduleId FK
        string jobName
        string jobStatus
        date startedAt
        date completedAt
    }

    FLIGHTS ||--o{ ASSIGNMENTS : has
    PILOTS ||--o{ ASSIGNMENTS : receives
    CABINCREW ||--o{ ASSIGNMENTS : receives
    AIRCRAFT ||--o{ FLIGHTS : operates
    SCHEDULES ||--o{ FLIGHTS : contains
    SCHEDULES ||--o{ SCHEDULINGJOBS : generates

flowchart TD
    A[Flight and Crew Information] --> B[E2 Data Validation]
    B --> C{Valid Data?}
    C -->|No| D[Return Validation Error]
    C -->|Yes| E[Save in MongoDB]

    E --> F[E1 Crew Assignment Engine]
    F --> G[Assignment Results]
    G --> H[E2 Save Assignment Records]

    H --> I[E3 Execution Management]
    I --> J[E4 Scheduling Application]
