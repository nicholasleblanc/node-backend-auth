import request from 'supertest';
import mongoose from 'mongoose';

import app from '../index';
import config from '../config/config';

import UserFixture from './fixtures/user.fixture';
import setup from './setup';

beforeEach(async () => await setup());

describe('/api/auth/register', () => {
  test('It should allow a user to register.', () => {
    const email = 'test@test.com';

    return request(app).post('/api/auth/register').send({
      email,
      password: 'P@ssw0rd'
    }).then((response) => {
      expect(response.statusCode).toBe(200);
      expect(response.body.data.user.email).toBe(email);
    });
  });

  test('It should not allow duplicate email addresses.', () => {
    return new UserFixture().save().then(user => {
      return request(app).post('/api/auth/register').send({
        email: user.email,
        password: 'P@ssw0rd'
      }).then((response) => {
        expect(response.statusCode).toBe(409);
      });
    });
  });

  test('It should not allow passwords less than 6 characters.', () => {
    return request(app).post('/api/auth/register').send({
      email: 'test@test.com',
      password: '12345'
    }).then((response) => {
      expect(response.statusCode).toBe(400);
    });
  });

  test('It should not allow malformed email addresses.', () => {
    return request(app).post('/api/auth/register').send({
      email: 'test',
      password: 'P@ssw0rd'
    }).then((response) => {
      expect(response.statusCode).toBe(400);
    });
  });

  test('It should not allow an empty email address.', () => {
    return request(app).post('/api/auth/register').send({
      email: '',
      password: 'P@ssw0rd'
    }).then((response) => {
      expect(response.statusCode).toBe(400);
    });
  });
});
