import argon2 from 'argon2';

export class PasswordService {
  async createHash(pwd: string) {
    return await argon2.hash(pwd);
  }

  async verify(hash: string, pwd: string) {
    return await argon2.verify(hash, pwd);
  }
}
