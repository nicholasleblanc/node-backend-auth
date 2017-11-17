# Decisive Lobster Backend - A very indecisive project.

## Install

Run the following commands from terminal after cloning the project:

- `cd decisive-lobster-backend`
- `yarn install`
- `npm run dev`

All endpoints are accessible at http://localhost:3000/api. Visiting http://localhost:3000/api/health-check should return `OK`.

## Todo:

[X] Replace Nunjucks with EJS.
[X] Add proper environment configs and support.
[X] Move Express config to own file.
[X] Move Passport config to own file.
[X] Move Mongoose config to own file.
[X] Move Winston config to own file.
[ ] Add expiry to token models instead of checking created date.
[ ] Add rate limiting to reset password.
[ ] Allow user to change password.
[ ] Allow user to change email address.
