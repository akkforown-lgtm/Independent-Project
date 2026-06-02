# Concurrent Booking Crash Test Report

Date: 2026-05-29

Environment:
- Client API: `http://localhost:3000`
- Admin UI/API: `http://localhost:3001`
- Database: real local MongoDB from `Client/server/.env`
- Test type: real HTTP requests against the running application, no mocks and no fake API responses

## Purpose

The goal was to check what happens when 100 different users try to reserve the same room at the same time, and then what happens when users also press the payment button at the same time.

The important application behavior found during code review:
- The client first calls `POST /api/bookings/hold` when the user proceeds to payment.
- If the hold succeeds, the payment modal opens.
- After payment, the client calls `POST /api/bookings/hold/:id/confirm`.
- Booking concurrency is protected by an in-process lock per city.
- The current limit check is based on city/date capacity via `RegionLimit`, not on a unique room/date constraint.

## Test 1: 100 Users Create Booking Directly

Endpoint used:
- `POST /api/auth/register`
- `POST /api/bookings`

Input:
- Users: 100 real registered users
- Room: `Single Room`
- City: `Tashkent`
- Dates: `2031-02-10` to `2031-02-11`
- Room price: `75`
- Nights: `1`

Result:
- 100 users were registered successfully.
- 100 booking requests were sent concurrently.
- 3 requests succeeded with HTTP `201`.
- 97 requests failed with HTTP `400` and code `REGION_LIMIT`.
- The server did not crash.
- MongoDB confirmed exactly 3 active matching bookings after the test.

Successful booking IDs:
- `6a195282ae74f79f5724b5d0`
- `6a195282ae74f79f5724b638`
- `6a195282ae74f79f5724b63d`

Observed latency:
- Minimum: `50ms`
- Average: `256ms`
- Maximum: `368ms`

## Test 2: 100 Users Hold, Then Pay

This test matched the real frontend flow more closely:
1. 100 users press the booking/payment button at the same time.
2. The application creates a temporary hold with `POST /api/bookings/hold`.
3. Only users with a successful hold can proceed to payment confirmation.
4. Successful holds are confirmed with `POST /api/bookings/hold/:id/confirm`.

Endpoints used:
- `POST /api/auth/register`
- `POST /api/bookings/hold`
- `POST /api/auth/cards`
- `POST /api/bookings/hold/:id/confirm`

Input:
- Users: 100 real registered users
- Room: `Economy Room`
- City: `Samarkand`
- Dates: `2031-03-15` to `2031-03-16`
- Room price: `95`
- Nights: `1`

Hold phase result:
- 100 users were registered successfully.
- 100 hold requests were sent concurrently.
- 3 hold requests succeeded with HTTP `201`.
- 97 hold requests failed with HTTP `400` and code `REGION_LIMIT`.
- Hold phase total time: `332ms`.

Users who received holds:
- `paycrash-1780044655831-0@example.com`
- `paycrash-1780044655831-1@example.com`
- `paycrash-1780044655831-3@example.com`

Hold IDs:
- `6a195385ae74f79f5724b8fe`
- `6a195385ae74f79f5724b966`
- `6a195385ae74f79f5724b96b`

Payment/confirm phase result:
- 3 users reached the payment confirmation stage.
- 3 confirm requests were sent concurrently.
- All 3 confirm requests succeeded with HTTP `200`.
- All 3 bookings became `active`.
- Confirm phase total time: `20ms`.

MongoDB verification:
- Matching active/hold bookings after confirmation: `3`
- Status distribution: `{ "active": 3 }`

## What The Program Did

The program did not allow all 100 users to book. It allowed only 3 bookings because the city limit for `Tashkent` and `Samarkand` was configured as `maxBookings: 3`.

The users who got the first successful locked requests received the available capacity. The rest received a `REGION_LIMIT` error and could not proceed.

## Important Finding

The application currently protects city/date capacity, not a specific room/date combination.

That means the system can create 3 active bookings for the same room and the same dates if the city limit is 3. In the tests, this happened for:
- `Single Room` in `Tashkent`
- `Economy Room` in `Samarkand`

If the business rule is "one physical room cannot be booked twice for overlapping dates", the current implementation needs an additional room-level concurrency rule. The current `RegionLimit` logic is not enough to prevent double or triple booking of the same room.

## Database State Before Cleanup

Before cleanup requested by the user:
- Users: `215`
- Bookings: `23`
- Rooms: `10`

The cleanup step should delete users and bookings only, leaving rooms intact.
