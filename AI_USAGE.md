# AI Usage Log

AI tools are allowed and expected. This log is not a confession — it is documentation of
how you worked. Declared use costs you nothing.

What we actually read is the last column: what you changed about the output, and why.
"Accepted as-is" is a valid answer for a config file and a worrying one for the
commission calculator.

Here is a cleaner and more complete **AI Usage Log** based on the Cadence work you have done so far:


## AI Usage Log

| Date       | Tool      | Where                                      | What I asked for                                                                                                                   | What I changed and why                                                                                                                                    |
| ---------- | --------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-12 | ChatGPT   | Project understanding and planning         | Asked for help understanding the Cadence assignment and organizing the initial tasks.                                              | I reviewed the assignment and decided the actual Day 1 deliverables and project plan myself.                                                              |
| 2026-08-12 | ChatGPT   | Authentication planning                    | Asked questions about the authentication requirements and what should be included in the login flow.                               | I selected the requirements that matched the assignment and implemented the authentication myself.                                                        |
| 2026-08-13 | ChatGPT   | Backend debugging                          | Shared my backend code and asked for help understanding PostgreSQL connection, foreign-key, TypeScript, and CORS errors.           | I applied the relevant fixes to my existing code and tested them locally.                                                                                 |
| 2026-08-13 | Gemini AI | Backend development                        | Used it occasionally to clarify Zod validation and API implementation questions.                                                   | I reviewed the suggestions and integrated only the parts that matched my existing implementation and assignment requirements.                             |
| 2026-08-13 | ChatGPT   | Authentication and authorization debugging | Shared my existing authentication, middleware, and React code and asked why certain authorization and login issues were occurring. | I modified my existing implementation based on the explanations and verified the behavior using different user roles.                                     |
| 2026-08-14 | ChatGPT   | Frontend debugging                         | Asked for help with React errors, routing, authentication state, and protected pages.                                              | I fixed the issues in my existing frontend code and tested the pages manually.                                                                            |
| 2026-08-15 | ChatGPT   | User management                            | Shared my existing user-management implementation and asked for help fixing and improving specific parts.                          | I kept my existing structure and modified the code according to the actual API and role requirements.                                                     |
| 2026-08-16 | ChatGPT   | Booking management                         | Shared my booking table and edit-page code and asked for help fixing API integration and form-loading issues.                      | I checked the actual API response and backend routes and corrected my existing frontend implementation, including changing the update request to `PATCH`. |

## Anything AI Got Wrong

## Anything AI Got Wrong

* AI initially used incorrect booking field names such as `customer_name`, `agent_id`, and `product`. I checked the actual API response and changed them to `external_ref`, `agent_code`, `booking_date`, `amount`, `currency`, `product_code`, and `status`.

* AI initially suggested using `PUT` for updating a booking. I checked my backend route and corrected it to `PATCH /bookings/:id`.

* AI initially assumed the wrong structure for the single-booking API response. I checked the response using Postman and adjusted my frontend code to use the actual response structure.

* The booking edit page remained on the loading screen even though the API worked correctly. I investigated the frontend route, `useParams()`, authentication loading state, and API request instead of assuming the backend was the problem.

* Some AI-generated code did not match my existing project structure. I kept my existing components and modified only the required sections instead of replacing the implementation.

* AI suggestions for authorization were sometimes focused on frontend restrictions. I recognized that frontend authorization alone is not secure and kept the backend `authenticate` and `requireRole` middleware as the main security controls.

* Some generated TypeScript code did not match my existing types and API responses. I used the TypeScript errors and actual API responses to correct my implementation.

* Some suggestions did not exactly match my existing PostgreSQL schema. I checked my actual database structure and adjusted the code accordingly.

* AI sometimes suggested solutions before I had fully checked the actual error. I learned to reproduce the problem, check browser console/API responses/Postman, and then use AI to help understand the issue.

* For financial calculations, I did not blindly use AI-generated JavaScript number calculations. I used `Decimal.js` where exact monetary calculations were required.

* For CSV processing, I changed the initial approach so that invalid records could be identified and reported with useful row-level errors instead of silently failing.

* Some UI suggestions did not match the role requirements. I adjusted the interface so Agents could view permitted records but could not see management actions such as Edit and Delete.


## Anything I Chose Not to Use AI For, and Why

* I did not use AI to build the complete application from scratch.
* I wrote the main backend and frontend implementation myself.
* I did not rely on AI for final database design decisions.
* I manually tested API endpoints using Postman.
* I manually tested role-based access and frontend behavior.
* I made the final decisions about how the implementation should satisfy the assignment requirements.


