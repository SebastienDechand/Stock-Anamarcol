import type { Express } from 'express';
import request from 'supertest';
import UserModel from '../../models/user.model';
import type { Role } from '../../constants';

// @types/superagent types "set-cookie" as a plain string, but Node's real
// http headers always return it as string[] - see @types/superagent/lib/node/response.d.ts.
export function setCookieHeader(res: request.Response): string[] {
  return res.headers['set-cookie'] as unknown as string[];
}

export interface SeededUser {
  id: string;
  cookie: string[];
}

// Creates a real user in the test DB and logs them in through the real
// /api/user/login route, returning their id and the jwt cookie to reuse
// across an integration suite's requests.
export async function seedUserAndLogin(
  app: Express,
  params: { username: string; email: string; password: string; roles: Role[] },
): Promise<SeededUser> {
  const user = await UserModel.create(params);
  const res = await request(app)
    .post('/api/user/login')
    .send({ email: params.email, password: params.password });
  return { id: user._id.toString(), cookie: setCookieHeader(res) };
}
