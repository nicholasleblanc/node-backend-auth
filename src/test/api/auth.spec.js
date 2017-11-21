import request from 'supertest';
import mongoose from 'mongoose';

import app from '../../config/express';
import config from '../../config/config';

import UserFixture from '../fixtures/user.fixture';
import VerificationTokenFixture from '../fixtures/verification-token.fixture';
import ForgotPasswordTokenFixture from '../fixtures/forgot-password-token.fixture';
import setup from '../setup';

beforeEach(async () => await setup());

describe('/api/auth/register', () => {
  test('It should allow a user to register.', () => {
    const email = 'test@test.com';

    return request(app).post('/api/auth/register')
      .send({
        email,
        password: 'P@ssw0rd'
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.email).toBe(email);
      });
  });

  test('It should not allow duplicate email addresses.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).post('/api/auth/register')
          .send({
            email: user.email,
            password: 'P@ssw0rd'
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(409);
        expect(response.body.error.errors[0].field[0]).toBe('email');
      });
  });

  test('It should not allow passwords < 6 characters.', () => {
    return request(app).post('/api/auth/register')
      .send({
        email: 'test@test.com',
        password: '12345'
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('password');
      });
  });

  test('It should not allow malformed email addresses.', () => {
    return request(app).post('/api/auth/register')
      .send({
        email: 'test',
        password: 'P@ssw0rd'
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('email');
      });
  });

  test('It should not allow an empty email address.', () => {
    return request(app).post('/api/auth/register')
      .send({
        email: '',
        password: 'P@ssw0rd'
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('email');
      });
  });
});

describe('/api/auth/login', () => {
  test('It should provide a token to a registered user.', () => {
    const password = 'P@ssw0rd';

    return new UserFixture({ password }).save()
      .then(user => {
        return request(app).post('/api/auth/login')
          .send({
            email: user.email,
            password
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveProperty('token');
      });
  });

  test('It should not provide a token to an user that does not exist.', () => {
    return request(app).post('/api/auth/login')
      .send({
        email: 'test@test.com',
        password: 'P@ssw0rd'
      })
      .then(response => {
        expect(response.statusCode).toBe(401);
      });
  });

  test('It should not provide a token to a registered user with the wrong password.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).post('/api/auth/login')
          .send({
            email: user.email,
            password: 'wrongpassword'
          })
          .then(response => {
            expect(response.statusCode).toBe(401);
          });
      });
  });
});

describe('/api/auth/activate', () => {
  const token = 'test';

  test('It should activate a user with a valid activation code.', () => {
    return new UserFixture().save()
      .then(user => {
        return new VerificationTokenFixture({ user, token }).save();
      })
      .then(verificationToken => {
        return request(app).post('/api/auth/activate')
          .send({ token });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test('It should not activate a user with invalid activation code.', () => {
    return new UserFixture().save()
      .then(user => {
        return new VerificationTokenFixture({ user }).save();
      })
      .then(verificationToken => {
        return request(app).post('/api/auth/activate')
          .send({ token: 'invalid' });
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('token');
      });
  });

  test('It should not allow the same activation code to be used twice.', () => {
    return new UserFixture().save()
      .then(user => {
        return new VerificationTokenFixture({ user, token }).save();
      })
      .then(verificationToken => {
        return request(app).post('/api/auth/activate')
          .send({ token });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);

        return request(app).post('/api/auth/activate')
          .send({ token });
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('token');
      });
  });
});

describe('/api/auth/forgot-password', () => {
  test('It should return success when using a valid email.', () => {
    return new UserFixture().save()
      .then(user => {
        return request(app).post('/api/auth/forgot-password')
          .send({ email: user.email });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test('It should return success when using an invalid email.', () => {
    return request(app).post('/api/auth/forgot-password')
      .send({ email: 'doesnotexist@email.com' })
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test('It should not return success when no email is provided.', () => {
    return request(app).post('/api/auth/forgot-password')
      .send()
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('email');
      });
  });
});

describe('/api/auth/reset-password', () => {
  const token = 'test';

  test('It should change a users password when using a valid token.', () => {
    let testUser = {};

    return new UserFixture().save()
      .then(user => {
        testUser = user; // FIXME: This isn't right, use Promise.all()
        return new ForgotPasswordTokenFixture({ user, token }).save();
      })
      .then(forgotPasswordToken => {
        return request(app).post('/api/auth/reset-password')
          .send({
            email: testUser.email,
            token,
            newPassword: 'P@ssw0rd'
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(200);
      });
  });

  test('It should not change a users password when using an invalid token.', () => {
    return request(app).post('/api/auth/reset-password')
      .send({
        email: 'test@test.com',
        token,
        newPassword: 'P@ssw0rd'
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('token');
      });
  });

  test('It should not change a users password when email address does not match.', () => {
    let testUser = {};

    return new UserFixture().save()
      .then(user => {
        testUser = user; // FIXME: This isn't right, use Promise.all()
        return new ForgotPasswordTokenFixture({ user, token }).save();
      })
      .then(forgotPasswordToken => {
        return request(app).post('/api/auth/reset-password')
          .send({
            email: 'wrong@test.com',
            token,
            newPassword: 'P@ssw0rd'
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('token');
      });
  });

  test('It should not change a users password if password < 6 characters.', () => {
    let testUser = {};

    return new UserFixture().save()
      .then(user => {
        testUser = user; // FIXME: This isn't right, use Promise.all()
        return new ForgotPasswordTokenFixture({ user, token }).save();
      })
      .then(forgotPasswordToken => {
        return request(app).post('/api/auth/reset-password')
          .send({
            email: testUser.email,
            token,
            newPassword: 'pass'
          });
      })
      .then(response => {
        expect(response.statusCode).toBe(400);
        expect(response.body.error.errors[0].field[0]).toBe('newPassword');
      });
  });
});
