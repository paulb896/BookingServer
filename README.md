# Appointment Booking Server

Uses Koa2 to Save Information in a json database, using Redis for caching json-rest queries and session data.

**TODO**

- [ ] Change JSON REST Server calls with PostgreSQL database call.
- [ ] Add Account creation.
- [ ] Add user login.
- [ ] Add company login.
- [ ] Refactor Code for increased testability.
- [ ] Add tests for each endpoint, and have tests document each Endpoint (BDD), which are also viewable in documentation.

## Build Dependencies

    npm i

## Run all dependencies in dev

    npm run dev-all

You should now be able to see [View Count Data](http://localhost:3000/view-counter) and [Company Booking Data](http://localhost:3000/company/1).

## Run each server individually

### Run Redis with Docker

    docker run redis

    # Run headless on port 6555
    docker run --name booking-cache -d redis -p 6555

### Run JSON REST Server

    json-server --watch db.json --port 4000

### Run Main Index Server for Development

    npm run dev

## Configuration

Modify [config/default.json](./config/default.json) to update server configs, **NOTE**: Doing this will break `npm run dev-all`

## Curl Booking Examples

### Add a New Company

    curl -X POST "http://localhost:3000/company" -H "Content-Type: application/json" -d '{"name": "New Place Here"}'

### Add a Booking for a Company

    curl -X POST "http://localhost:3000/company/2/booking" -H "Content-Type: application/json" -d '{"startTime": "Start Date Time", "endTime": "End Date Time", "email": "user@email.com"}'

### Get Bookings for a Company

    curl http://localhost:3000/company/1