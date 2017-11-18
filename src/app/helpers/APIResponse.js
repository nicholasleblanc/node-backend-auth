const httpStatus = require('http-status');

class APIResponse {
  constructor({
    res,
    data = {},
    status = httpStatus.OK
  }) {
    res.status(status);
    res.json({ data });
  }
}

export default APIResponse
