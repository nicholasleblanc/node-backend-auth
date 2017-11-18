import app from './config/express';
import mongoose from './config/mongoose'
import logger from './app/helpers/logger'

import config from './config/config'

// Connect to MongoDB.
mongoose.connect(`mongodb://${config.mongodb.user}:${config.mongodb.pass}@` +
  `${config.mongodb.host}:${config.mongodb.port}/${config.mongodb.name}`, {
  useMongoClient: true
});

// Start server.
app.listen(config.port, () => {
  logger.info(`RESTful API server started on: ${config.port}`)
});

export default app;
