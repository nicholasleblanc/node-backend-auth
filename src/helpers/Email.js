import Email from 'email-templates';
import path from 'path';

const email = new Email({
  message: {
    from: 'test@gmail.com'
  },
  transport: {
    jsonTransport: true
  },
  views: {
    options: {
      extension: 'nunjucks'
    },
    root: path.resolve('src/templates/emails')
  }
});

export default email
