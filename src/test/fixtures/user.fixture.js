import User from '../../models/user.model';

class UserFixture {
  constructor({
    email = 'test@test.com',
    password = 'P@ssw0rd'
  } = {}) {
    return new User({
      email,
      password
    });
  }
}

export default UserFixture;
