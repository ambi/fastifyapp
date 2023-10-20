import { FastifyReply, FastifyRequest } from 'fastify';
import { FromSchema } from 'json-schema-to-ts';

import { Config } from '../../config/config.js';
import { SigninParams, SigninService } from '../services/signin.service.js';
import { AuthenticationResult } from '../models/session.js';
import { getSession, resetSession, saveSession } from './session.js';
import { signinSchema } from './signin.schema.js';

declare module 'fastify' {
  export interface FastifyRequest {
    flash(type: string, ...message: string[] | [string[]]): number;
  }
  export interface FastifyReply {
    flash(type?: string): { [k: string]: string[] | undefined } | string[];
  }
}

export const DEFAULT_POST_SIGNIN = '/home';

export class SigninController {
  constructor(
    private cfg: Config,
    private signinSvc: SigninService,
  ) {
  }

  async signinPage(req: FastifyRequest, res: FastifyReply) {
    return res.status(200).view('src/id/views/signin', {
      csrfToken: res.generateCsrf(),
      errorMessages: res.flash('error') || [],
    });
  }

  async signin(req: FastifyRequest<{ Body: FromSchema<typeof signinSchema> }>, res: FastifyReply) {
    const params: SigninParams = {
      userName: req.body.username,
      password: req.body.password,
    };
    const result = await this.signinSvc.signin(req.log, params);

    if (result.authenticationResult !== AuthenticationResult.SUCCESS) {
      req.flash('error', 'Signin failed');
      return res.redirect(this.cfg.signinPath);
    }

    const session = { ...getSession(req), ...result };
    // Reset the session against session fixation attacks.
    await resetSession(req);
    await saveSession(req, session);

    return res.redirect(session.postSignin || DEFAULT_POST_SIGNIN);
  }

  async signout(req: FastifyRequest, res: FastifyReply) {
    await saveSession(req, {
      authenticationResult: null,
      userId: null,
    });

    // TODO: redirect to the post-signout endpoint.
  }
}
