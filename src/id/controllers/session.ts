import { FastifyRequest } from 'fastify';

import { AuthenticationResult, Session } from '../models/session.js';

declare module 'fastify' {
  interface Session {
    authentication_result: AuthenticationResult | null;
    user_id: string | null;
    post_signin: string | null;
    post_signin_params: any;
  }
}

export function getSession(req: FastifyRequest): Session {
  return {
    authenticationResult: req.session.authentication_result,
    userId: req.session.user_id,
    postSignin: req.session.post_signin,
  };
}

export async function saveSession(req: FastifyRequest, session: Session) {
  if (session.authenticationResult !== undefined) {
    req.session.authentication_result = session.authenticationResult;
  }
  if (session.userId !== undefined) {
    req.session.user_id = session.userId;
  }
  if (session.postSignin !== undefined) {
    req.session.post_signin = session.postSignin;
  }

  return new Promise<Error | undefined>((resolve, reject) => {
    req.session.save(resolve);
  });
}

export async function resetSession(req: FastifyRequest) {
  return new Promise<Error | undefined>((resolve, reject) => {
    req.session.regenerate(resolve);
  });
}
