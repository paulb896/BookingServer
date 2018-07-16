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

### Run Redis Docker on Port *6555*

    docker run redis

    # Run headless on port 6555
    docker run --name booking-cache -d redis -p 6555

### Run JSON REST Server

    json-server --watch db.json --port 4000

## Run Main Index Server for Development

    npm run dev