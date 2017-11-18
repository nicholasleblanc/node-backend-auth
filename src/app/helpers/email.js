import Email from 'email-templates';
import path from 'path';

const email = new Email({
  message: {
    from: 'test@gmail.com' // TODO: Add to config, add name.
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
