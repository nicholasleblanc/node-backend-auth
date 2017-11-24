import app from './config/express';
import mongoose from './config/mongoose'
import logger from './helpers/logger'

import config from './config/config'

// Connect to MongoDB.
mongoose.connect(config.mongodb, {
  useMongoClient: true
});

// Start server.
app.listen(config.port, () => {
  logger.info(`RESTful API server started on: ${config.port}`)
});

export default app;
