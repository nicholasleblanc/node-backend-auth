import mongoose from 'mongoose';

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
