import supertest from 'supertest';
import setCookie from 'set-cookie-parser';
import * as cheerio from 'cheerio';

import { createApp, defaultConfig } from '../../src/app/app.js';
import { User } from '../../src/id/models/user.js';
import { Users } from '../../src/id/repositories/users.js';
import { createTestData } from '../../src/app/test-data.js';

const cfg = defaultConfig;
const users = new Users();
let app: Awaited<ReturnType<typeof createApp>>;
let testData: {
  users: User[];
  userPasswords: string[];
};

beforeAll(async () => {
  app = await createApp(false, cfg, users);
  testData = await createTestData(users);

  await app.ready();
});

afterAll(() => {
  app.close();
});

describe('GET /signin', () => {
  it('returns the signin page', async () => {
    const agent = supertest.agent(app.server);

    const res = await agent.get('/signin');
    expect(res.status).toBe(200);
    expect(res.text).toMatch('username');
    expect(res.text).toMatch('csrf');
  });
});

describe('GET /home', () => {
  it('redirects to the signin page (unauthenticated)', async () => {
    const agent = supertest.agent(app.server);

    const res = await agent.get('/home');
    expect(res.status).toBe(302);
    expect(res.headers['location']).toEqual('/signin');
  });

  it('returns the home page (authenticated)', async () => {
    const agent = supertest.agent(app.server);

    let res = await agent.get('/home');
    expect(res.status).toBe(302);
    let location = res.headers['location'];
    expect(location).toEqual('/signin');
    let sCookies = setCookie(res.headers['set-cookie']);
    let cookies = sCookies.map((c) => `${c.name}=${c.value}`).join('; ');

    res = await agent.get(location).set('cookie', cookies);
    expect(res.status).toBe(200);
    const dollar = cheerio.load(res.text);
    const csrfToken = dollar('#signin-csrf').attr('value');

    res = await agent.post(location).set('cookie', cookies)
      .send(`username=${testData.users[0].userName}`)
      .send(`password=${testData.userPasswords[0]}`)
      .send(`_csrf=${csrfToken}`);
    expect(res.status).toBe(302);
    location = res.headers['location'];
    expect(location).toEqual('/home');
    sCookies = setCookie(res.headers['set-cookie']);
    cookies = sCookies.map((c) => `${c.name}=${c.value}`).join('; ');

    res = await agent.get(location).set('cookie', cookies);
    expect(res.status).toBe(200);
    expect(res.text).toMatch(`User name: ${testData.users[0].userName}`);
  });
});
