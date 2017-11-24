import Email from 'email-templates';
import path from 'path';

import config from '../config/config';

const email = new Email({
  message: {
    from: config.email.from
  },
  transport: {
    jsonTransport: true
  },
  views: {
    options: {
      extension: 'ejs'
    },
    root: path.resolve('src/templates/emails')
  }
});

export default email
