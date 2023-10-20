import { FastifyReply, FastifyRequest } from 'fastify';

import { Config } from '../../config/config.js';
import { getSession, saveSession } from '../../id/controllers/session.js';
import { HomeService } from '../services/home.service.js';

export class HomeController {
  constructor(private cfg: Config, private homeSvc: HomeService) {}

  async home(req: FastifyRequest, res: FastifyReply) {
    const session = getSession(req);
    if (session.authenticationResult !== 'success' || !session.userId) {
      await saveSession(req, {
        postSignin: this.cfg.homePath,
      });
      return res.redirect(this.cfg.signinPath);
    }

    const params = { userId: session.userId };
    const result = await this.homeSvc.home(params);

    return res.status(200).view('src/home/views/home', { user: result.user });
  }
}
