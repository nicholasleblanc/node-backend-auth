import app from './config/express';
import mongoose from './config/mongoose'
import winstonInstance from './config/winston'

import config from './config/config'

// Connect to MongoDB
mongoose.connect('mongodb://localhost/decisive-lobster', {
  useMongoClient: true
});

// Start server
app.listen(config.port, () => {
  winstonInstance.info(`RESTful API server started on: ${config.port}`)
});

export default app;
