import { jest } from 'jest';

import VerificationToken from '../../../app/models/verification-token.model';

import VerificationTokenFixture from '../../fixtures/verification-token.fixture';

describe('VerificationToken', () => {
  describe('validate', () => {
    test('It should not validate if token not provided.', () => {
      const verificationToken = new VerificationToken();

      verificationToken.validate()
        .catch(error => {
          expect(error.errors).toHaveProperty('token');
        });
    });

    test('It should not validate if user not provided.', () => {
      const verificationToken = new VerificationToken();

      verificationToken.validate()
        .catch(error => {
          expect(error.errors).toHaveProperty('user');
        });
    });
  });

  describe('generateToken', () => {
    test('It should be 32 characters long.', () => {
      const token = VerificationToken.generateToken();
      expect(token).toHaveLength(32);
    });
  });

  describe('getHash', () => {
    // Probably not the best test, but it at least ensure's we get a predictable value.
    test('It should compute hash of token.', () => {
      const hash = VerificationToken.getHash('test');
      expect(hash).toBe('0329a06b62cd16b33eb6792be8c60b158d89a2ee3a876fce9a881ebb488c0914');
    });
  });
});
