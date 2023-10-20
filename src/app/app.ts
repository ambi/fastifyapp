import Fastify from 'fastify';
import cookie from '@fastify/cookie';
import csrfProtection from '@fastify/csrf-protection';
import flash from '@fastify/flash';
import formbody from '@fastify/formbody';
import session from '@fastify/session';
import view from '@fastify/view';
import handlebars from 'handlebars';
import { FromSchema } from 'json-schema-to-ts';

import { Config } from '../config/config.js';
import { PasswordService } from '../id/services/password.service.js';
import { UserRepo } from '../id/services/user.repo.js';
import { SigninService } from '../id/services/signin.service.js';
import { HomeService } from '../home/services/home.service.js';
import { SigninController } from '../id/controllers/signin.controller.js';
import { HomeController } from '../home/controllers/home.controller.js';
import { signinSchema } from '../id/controllers/signin.schema.js';

export const defaultConfig: Config = {
  port: 8080,
  sessionSecret: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',

  homePath: '/home',
  signinPath: '/signin',
};

export async function createApp(cfg: Config, users: UserRepo) {
  const app = Fastify({
    logger: {
      formatters: {
        level: (label) => {
          return { level: label.toUpperCase() };
        },
      },
    },
  });

  // Use formbody plugin.
  app.register(formbody);

  // Use cookie plugin.
  app.register(cookie);
  // Use session plugin.
  app.register(session, {
    secret: cfg.sessionSecret,
    cookieName: 'app-sessionid',
    cookie: { secure: false }, // TODO: true in production.
    saveUninitialized: false,
  });
  // Use flash plugin.
  app.register(flash);

  // Use CSRF plugin.
  // Awaiting csrfProtection is required. If you don't wait for it, CSRF protection may be disabled!
  // But should I await any other plugins too? I don't know ... Please teach me documentation about it.
  await app.register(csrfProtection, { sessionPlugin: '@fastify/session' });

  // Use CORS plugin.
  // import cors from '@fastify/cors';
  // await fastify.register(cors, { });

  // Use handlebars as the template engine.
  app.register(view, {
    engine: { handlebars },
    viewExt: 'handlebars',
    layout: 'views/layouts/main.handlebars',
  });

  const pwdSvc = new PasswordService();
  const signinSvc = new SigninService(pwdSvc, users);
  const homeSvc = new HomeService(users);
  const signinCtr = new SigninController(cfg, signinSvc);
  const homeCtr = new HomeController(cfg, homeSvc);

  app.get(cfg.homePath, homeCtr.home.bind(homeCtr));
  app.get(cfg.signinPath, signinCtr.signinPage.bind(signinCtr));
  app.post<{ Body: FromSchema<typeof signinSchema> }>(cfg.signinPath, {
    preHandler: app.csrfProtection,
    schema: { body: signinSchema },
  }, signinCtr.signin.bind(signinCtr));

  app.setNotFoundHandler((req, res) => {
    const { url, method } = req.raw;
    app.log.warn('not found error', { method, url });
    res.status(404).send({ error: 'not found' });
  });

  app.setErrorHandler((error, req, res) => {
    app.log.error('server error', { error });
    res.status(500).send({ error: 'server error' });
  });

  return app;
}
