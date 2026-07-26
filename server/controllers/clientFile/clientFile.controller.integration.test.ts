import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import ClientFileModel from '../../models/clientFile.model';
import { Role } from '../../constants';
import { ErrorCode } from '../../constants/errorCodes';
import { connectTestDb, disconnectTestDb } from '../../utils/testDb/testDb.utils';
import { seedUserAndLogin } from '../../utils/testAuth/testAuth.utils';

const VALID_FILE = {
  lastName: 'Dupont',
  address: '1 rue de la Paix',
};

describe('Client file CRUD flow (integration)', () => {
  let adminCookie: string[];
  let monteurCookie: string[];
  let userCookie: string[];

  beforeAll(async () => {
    await connectTestDb();

    adminCookie = (
      await seedUserAndLogin(app, {
        username: 'admin_it',
        email: 'admin_it@test.com',
        password: 'adminpass',
        roles: [Role.ADMIN],
      })
    ).cookie;

    monteurCookie = (
      await seedUserAndLogin(app, {
        username: 'monteur_it',
        email: 'monteur_it@test.com',
        password: 'monteurpass',
        roles: [Role.MONTEUR],
      })
    ).cookie;

    userCookie = (
      await seedUserAndLogin(app, {
        username: 'user_it',
        email: 'user_it@test.com',
        password: 'userpass',
        roles: [Role.USER],
      })
    ).cookie;
  });

  afterEach(async () => {
    await ClientFileModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('POST /api/client-files/', () => {
    it('returns 401 without a cookie', async () => {
      const res = await request(app).post('/api/client-files/').send(VALID_FILE);
      expect(res.status).toBe(401);
    });

    it('returns 403 for an authenticated user without the monteur/admin role', async () => {
      const res = await request(app)
        .post('/api/client-files/')
        .set('Cookie', userCookie)
        .send(VALID_FILE);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe(ErrorCode.ACCESS_DENIED_MONTEUR);
    });

    it('creates a client file as monteur', async () => {
      const res = await request(app)
        .post('/api/client-files/')
        .set('Cookie', monteurCookie)
        .send(VALID_FILE);

      expect(res.status).toBe(201);
      expect(res.body._id).toBeDefined();
      expect(res.body.lastName).toBe(VALID_FILE.lastName);
    });

    it('returns 409 on a duplicate SIRET + address', async () => {
      await ClientFileModel.create({ ...VALID_FILE, siret: '12345678900012' });

      const res = await request(app)
        .post('/api/client-files/')
        .set('Cookie', monteurCookie)
        .send({ ...VALID_FILE, lastName: 'Martin', siret: '12345678900012' });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ErrorCode.CLIENT_FILE_DUPLICATE_SIRET);
    });

    it('returns 409 on a duplicate lastName + address when there is no SIRET', async () => {
      await ClientFileModel.create(VALID_FILE);

      const res = await request(app)
        .post('/api/client-files/')
        .set('Cookie', monteurCookie)
        .send(VALID_FILE);

      expect(res.status).toBe(409);
      expect(res.body.code).toBe(ErrorCode.CLIENT_FILE_DUPLICATE_NAME);
    });
  });

  describe('PUT /api/client-files/:id', () => {
    it('returns 403 for an authenticated user without the monteur/admin role', async () => {
      const file = await ClientFileModel.create(VALID_FILE);
      const res = await request(app)
        .put(`/api/client-files/${file._id}`)
        .set('Cookie', userCookie)
        .send({ city: 'Lyon' });

      expect(res.status).toBe(403);
    });

    it('updates the client file as monteur', async () => {
      const file = await ClientFileModel.create(VALID_FILE);
      const res = await request(app)
        .put(`/api/client-files/${file._id}`)
        .set('Cookie', monteurCookie)
        .send({ city: 'Lyon' });

      expect(res.status).toBe(200);
      expect(res.body.city).toBe('Lyon');
    });
  });

  describe('DELETE /api/client-files/:id', () => {
    it('returns 403 for monteur (route is admin-only)', async () => {
      const file = await ClientFileModel.create(VALID_FILE);
      const res = await request(app)
        .delete(`/api/client-files/${file._id}`)
        .set('Cookie', monteurCookie);

      expect(res.status).toBe(403);
    });

    it('deletes the client file as admin', async () => {
      const file = await ClientFileModel.create(VALID_FILE);

      const deleteRes = await request(app)
        .delete(`/api/client-files/${file._id}`)
        .set('Cookie', adminCookie);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.code).toBe(ErrorCode.CLIENT_FILE_DELETED);

      const getRes = await request(app)
        .get(`/api/client-files/${file._id}`)
        .set('Cookie', adminCookie);
      expect(getRes.status).toBe(404);
    });
  });
});
