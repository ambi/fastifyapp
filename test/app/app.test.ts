import axios, { CreateAxiosDefaults, AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp, defaultConfig } from '../../src/app/app.js';
import { createTestData } from '../../src/app/test-data.js';
import { User } from '../../src/id/models/user.js';
import { Users } from '../../src/id/repositories/users.js';
import { AddressInfo } from 'net';

const axiosCfg: CreateAxiosDefaults = {
  validateStatus: () => true, // Don't throw HTTP exceptions.
  maxRedirects: 0, // No redirects.
};

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

  await app.listen(); // Use randomized port in tests.
  const address = app.server.address() as AddressInfo;
  axiosCfg.baseURL = `http://127.0.0.1:${address.port}`;
});

afterAll(() => {
  app.close();
});

describe('GET /signin', () => {
  it('returns the signin page', async () => {
    const agent = axios.create(axiosCfg);

    const res = await agent.get('/signin');
    expect(res.status).toBe(200);
    expect(res.data).toMatch('username');
    expect(res.data).toMatch('csrf');
  });
});

describe('GET /home', () => {
  it('redirects to the signin page (unauthenticated)', async () => {
    const agent = axios.create(axiosCfg);

    const res = await agent.get('/home');
    expect(res.status).toBe(302);
    expect(res.headers.location).toEqual('/signin');
  });

  it('returns the home page (authenticated)', async () => {
    const agent = axios.create(axiosCfg);

    let res = await agent.get('/home');
    expect(res.status).toBe(302);
    let location = res.headers.location;
    expect(location).toEqual('/signin');
    let cookie = getSessionCookie(res);

    res = await agent.get(location, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    const dollar = cheerio.load(res.data);
    const csrfToken = dollar('#signin-csrf').attr('value');

    const params = new URLSearchParams({
      username: testData.users[0].userName,
      password: testData.userPasswords[0],
      _csrf: csrfToken!,
    });
    res = await agent.post(location, params, { headers: { Cookie: cookie } });
    expect(res.status).toBe(302);
    location = res.headers.location;
    expect(location).toEqual('/home');
    cookie = getSessionCookie(res);

    res = await agent.get(location, { headers: { Cookie: cookie } });
    expect(res.status).toBe(200);
    expect(res.data).toMatch(`User name: ${testData.users[0].userName}`);
  });
});


function getSessionCookie(res: AxiosResponse) {
  const setCookie = res.headers['set-cookie'];
  if (!setCookie) {
    return '';
  }

  const sessionCookie = setCookie.find(cookie => cookie.match(/^app-sessionid=[a-zA-Z0-9]/));
  if (!sessionCookie) {
    return '';
  }

  return sessionCookie.replace(/;.*/, '');
}