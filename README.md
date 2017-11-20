# Decisive Lobster Backend - A very indecisive project.

Not quite sure what we're building here. But it will be rock solid.

## Requirements

- [NodeJS](https://nodejs.org/en/)
- [Yarn](https://yarnpkg.com/en/)
- [MongoDB](https://www.mongodb.com/)

## Install

Run the following commands from terminal after cloning the repo:

- `cd decisive-lobster-backend`
- `yarn install`
- `npm run dev`

All endpoints are accessible at http://localhost:3000/api. Visiting http://localhost:3000/api/health-check should return `OK`.

### Local Config

You can create a local environment config file by creating `/src/config/config.local.js`. From here you can overwrite any default or environment configuration options.

### Commands

- `npm run`: Run development server.
- `npm test`: Run tests once.
- `npm run test:watch`: Watch code for changes and re-run tests each time any `*.js` files are changed.
