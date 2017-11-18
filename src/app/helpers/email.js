import Email from 'email-templates';
import path from 'path';

import config from '../../config/config';

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
    root: path.resolve('src/app/templates/emails')
  }
});

export default email
