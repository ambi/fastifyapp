import { User } from '../id/models/user.js';
import { PasswordService } from '../id/services/password.service.js';
import { UserRepo } from '../id/services/user.repo.js';

export async function createTestData(users: UserRepo) {
  const pwdSvc = new PasswordService();
  const userPassword = 'fastifypwd';
  const user: User = {
    id: 'USER_ID1',
    userName: 'user1@example.com',
    passwordHash: await pwdSvc.createHash(userPassword),
    attrs: [],
  };
  await users.save(user);

  return {
    users: [user],
    userPasswords: [userPassword],
  };
}
