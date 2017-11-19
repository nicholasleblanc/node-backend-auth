import config from '../config/config';
import mongoose from '../config/mongoose';

// Connect to MongoDB.
// FIXME: This is causing a memory leak when running tests on watch mode.
// Need to figure out how to ensure we only have a single connection for all
// test suites.
mongoose.connect(config.mongodb, {
  useMongoClient: true
});

// Wipe out all data in database.
const clearDatabase = () => {
  return new Promise(resolve => {
    let cont = 0;
    let max = Object.keys(mongoose.connection.collections).length;
    for (const i in mongoose.connection.collections) {
      mongoose.connection.collections[i].remove(function() {
        cont++;
        if(cont >= max) {
          resolve();
        }
      });
    }
  });
}

const setupTest = async () => {
  await clearDatabase();
}

export default setupTest
