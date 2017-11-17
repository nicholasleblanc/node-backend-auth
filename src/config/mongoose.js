import mongoose from 'mongoose';

import config from './config';

mongoose.Promise = global.Promise;

if (config.dev) {
  mongoose.set('debug', true);
}

export default mongoose;
