import { BaseLogger } from 'pino';

import { AuthenticationResult } from '../models/session.js';
import { PasswordService } from './password.service.js';
import { UserRepo } from './user.repo.js';

export interface SigninParams {
  userName: string;
  password: string;
}

export interface SigninResult {
  authenticationResult: AuthenticationResult;
  userId?: string;
  reason?: string;
}

export class SigninService {
  constructor(private pwds: PasswordService, private users: UserRepo) {}

  async signin(log: BaseLogger, params: SigninParams): Promise<SigninResult> {
    const user = await this.users.findByUserName(params.userName);
    if (!user) {
      log.warn({ userName: params.userName }, 'signin: user not found');
      return { authenticationResult: AuthenticationResult.FAILURE, reason: 'user_not_found' };
    }

    const validPwd = await this.pwds.verify(user.passwordHash, params.password);
    if (!validPwd) {
      log.warn({ userName: params.userName }, 'signin: invalid password');
      return { authenticationResult: AuthenticationResult.FAILURE, reason: 'invalid_password' };
    }

    log.info({ userName: params.userName }, 'signin: authenticated');
    return { authenticationResult: AuthenticationResult.SUCCESS, userId: user.id };
  }
}
