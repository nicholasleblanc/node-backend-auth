import VerificationToken from '../../app/models/verification-token.model';

class VerificationTokenFixture {
  constructor({
    user,
    token = 'test'
  } = {}) {
    return new VerificationToken({
      user,
      token
    });
  }
}

export default VerificationTokenFixture;
