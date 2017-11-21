import config from '../config/config';
import mongoose from '../config/mongoose';

// Connect to MongoDB.
//
// FIXME: This is causing a memory leak when running tests on watch mode.
// Need to figure out how to ensure we only have a single connection for all
// test suites.
//
// So, since Jest runs tests in parallel, we need to append the process ID to
// the database to ensure we don't get test data colliding with other test data.
mongoose.connect(`${config.mongodb}-${process.pid}`, { useMongoClient: true });

// Wipe out all data in database.
const setup = () => {
  return new Promise(resolve => {
    const removePromises = [];

    for (const i in mongoose.connection.collections) {
      removePromises.push(mongoose.connection.collections[i].remove());
    }

    Promise.all(removePromises).then(() => resolve());
  });
}

const teardown = () => {
  mongoose.connection.db.dropDatabase();
}

export default { setup, teardown }
