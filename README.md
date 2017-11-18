# Decisive Lobster Backend - A very indecisive project.

Not quite sure what we're building here. But it will be rock solid.

## Requirements

- [NodeJS](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/en/)
- Brains

## Install

Run the following commands from terminal after cloning the repo:

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
[X] Figure out system logging vs API response messaging.
[ ] Ensure we're checking for active accounts when accessing authenticated pages.
[X] Add expiry to token models instead of checking created date.
[ ] Add rate limiting to reset password.
[ ] ACL: Groups, roles, and permissions.
[ ] Allow user to change password.
[ ] Allow user to change email address.
[ ] Figure out testing! Would like to check out Jest.
