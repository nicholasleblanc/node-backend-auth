import request from 'supertest';

import app from '../config/express';

describe('/api', () => {
  test('Tests should be run in "test" environment.', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });
});

describe('/api/health-check', () => {
  test('It should return "OK".', () => {
    return request(app).get('/api/health-check')
      .send()
      .then((response) => {
        expect(response.statusCode).toBe(200);
        expect(response.text).toBe('OK');
      });
  });
});
