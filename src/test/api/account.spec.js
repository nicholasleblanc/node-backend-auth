import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../config/express';
import config from '../../config/config';

import UserFixture from '../fixtures/user.fixture';
import setup from '../setup';

beforeEach(async () => await setup());

describe('/api/account', () => {
  test('It should allow users to change their email address.', () => {
    const newEmail = 'newemail@test.com';

    return new UserFixture().save()
      .then(user => {
        return request(app).patch('/api/account')
          .set('Authorization', `Bearer ${user.getJwtToken()}`)
          .send({
            email: newEmail
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.email).toBe(newEmail);
      });
  });

  test('It should allow users to change their password.', () => {
    const password = 'password';
    const newPassword = 'newpassword';

    return new UserFixture({ password: password }).save()
      .then(user => {
        return request(app).patch('/api/account')
          .set('Authorization', `Bearer ${user.getJwtToken()}`)
          .send({
            password: password,
            newPassword: newPassword
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
        // TODO: Need unit test to make sure password is actually changed, 200 response dosen't confirm that.
      });
  });

  test('It should not allow users to change their password if their current one is incorrect.', () => {
    const newPassword = 'newpassword';

    return new UserFixture().save()
      .then(user => {
        return request(app).patch('/api/account')
          .set('Authorization', `Bearer ${user.getJwtToken()}`)
          .send({
            password: 'wrongpassword',
            newPassword: newPassword
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(409);
        expect(response.body.error.errors[0].field[0]).toBe('password');
      });
  });

  test('It should not allow users to change their email address to one belonging to another account.', () => {
    const duplicateEmail = 'duplicate@test.com';

    return new UserFixture({ email: duplicateEmail }).save()
      .then(() => {
        return new UserFixture().save();
      })
      .then(user => {
        return request(app).patch('/api/account')
          .set('Authorization', `Bearer ${user.getJwtToken()}`)
          .send({
            email: duplicateEmail
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(409);
        expect(response.body.error.errors[0].field[0]).toBe('email');
      });
  });

  test('It should not allow unauthenticated users to access the page.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).patch('/api/account')
          .send();
      })
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });

  test('It should not allow malformed email addresses.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).patch('/api/account')
          .set('Authorization', `Bearer ${user.getJwtToken()}`)
          .send({
            email: 'test'
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('email');
      });
  });
});

describe('/api/account/resend-activation-email', () => {
  test('It should resend account activation email.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).get('/api/account/resend-activation-email')
          .set('Authorization', `Bearer ${user.getJwtToken()}`)
          .send();
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test('It should not allow unauthenticated users to access the page.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).get('/api/account/resend-activation-email')
          .send();
      })
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });
});
