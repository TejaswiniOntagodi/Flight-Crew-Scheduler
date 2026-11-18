# Flight Crew Scheduler – MongoDB Queries

Database: `flight_crew_scheduler`

## 1. Select Database

```javascript
use flight_crew_scheduler
```

## 2. Check Collection Counts

### Pilots
```javascript
db.pilots.countDocuments()
```

### Cabin Crew
```javascript
db.cabincrews.countDocuments()
```

### Flights
```javascript
db.flights.countDocuments()
```

### Assignments
```javascript
db.assignments.countDocuments()
```

## 3. Display All Records

### All Pilots
```javascript
db.pilots.find().pretty()
```

### All Cabin Crew
```javascript
db.cabincrews.find().pretty()
```

### All Flights
```javascript
db.flights.find().pretty()
```

### All Assignments
```javascript
db.assignments.find().pretty()
```

## 4. Display Collection Names

```javascript
show collections
```

## 5. Database Statistics

```javascript
db.stats()
```

## 6. Get All Four Collection Counts Together

```javascript
print("Pilots: " + db.pilots.countDocuments());
print("Cabin Crew: " + db.cabincrews.countDocuments());
print("Flights: " + db.flights.countDocuments());
print("Assignments: " + db.assignments.countDocuments());
```

## 7. Display Active Assignments

```javascript
db.assignments.find({
    assignmentStatus: "Assigned"
}).pretty()
```

## 8. Count Active Assignments

```javascript
db.assignments.countDocuments({
    assignmentStatus: "Assigned"
})
```

**Note:** Run these queries in MongoDB Compass Shell after selecting the correct database. Collection names must match the actual names in MongoDB.