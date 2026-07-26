import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Mock the UserModel
vi.mock('../../models/user.model', () => {
  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    username: 'testuser',
    email: 'test@test.com',
    roles: ['user'],
    password: 'hashedpassword',
    save: vi.fn(),
  };

  const UserModel = {
    findById: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        lean: vi.fn().mockResolvedValue(mockUser),
      }),
    }),
  };

  return { __esModule: true, default: UserModel };
});

import {
  checkUser,
  requireAuth,
  requireAdmin,
  requireSuperAdmin,
  requireHotline,
  requireMonteur,
} from './auth.middleware';

describe('Auth Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      locals: {},
      status: vi.fn().mockReturnThis() as unknown as Response['status'],
      json: vi.fn() as unknown as Response['json'],
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  // #region checkUser
  describe('checkUser', () => {
    it('should call next with user = null when no token', () => {
      checkUser(req as Request, res as Response, next);
      expect(res.locals!.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });

    it('should decode the token and load the user', async () => {
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_SECRET!);
      req.cookies = { jwt: token };

      await checkUser(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(next).toHaveBeenCalled();
    });

    it('should set user to null when token is invalid', async () => {
      req.cookies = { jwt: 'invalid-token' };

      await checkUser(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.locals!.user).toBeNull();
      expect(next).toHaveBeenCalled();
    });
  });
  // #endregion

  // #region requireAuth
  describe('requireAuth', () => {
    it('should return 401 when no token is provided', () => {
      requireAuth(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });

    it('should return 401 when token is invalid', async () => {
      req.cookies = { jwt: 'bad-token' };

      await requireAuth(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should call next when token is valid', async () => {
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_SECRET!);
      req.cookies = { jwt: token };

      await requireAuth(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(next).toHaveBeenCalled();
    });
  });
  // #endregion

  // #region requireAdmin
  describe('requireAdmin', () => {
    it('should return 401 when no token is provided', () => {
      requireAdmin(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 401 when token is invalid', async () => {
      req.cookies = { jwt: 'invalid' };

      await requireAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not admin or superadmin', async () => {
      // mockUser has role Role.USER by default
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_SECRET!);
      req.cookies = { jwt: token };

      await requireAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied - admin required',
        code: 'ACCESS_DENIED_ADMIN',
      });
    });
  });
  // #endregion

  // #region requireSuperAdmin
  describe('requireSuperAdmin', () => {
    it('should return 401 when no token is provided', () => {
      requireSuperAdmin(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });

    it('should return 401 when token is invalid', async () => {
      req.cookies = { jwt: 'bad-token' };

      await requireSuperAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not superadmin', async () => {
      // mockUser has role "user" by default
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_SECRET!);
      req.cookies = { jwt: token };

      await requireSuperAdmin(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied - superadmin required',
        code: 'ACCESS_DENIED_SUPERADMIN',
      });
    });
  });
  // #endregion

  // #region requireHotline
  describe('requireHotline', () => {
    it('should return 401 when no token is provided', () => {
      requireHotline(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });

    it('should return 403 when user is not hotline/admin/superadmin', async () => {
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_SECRET!);
      req.cookies = { jwt: token };

      await requireHotline(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied - hotline or admin required',
        code: 'ACCESS_DENIED_HOTLINE',
      });
    });
  });
  // #endregion

  // #region requireMonteur
  describe('requireMonteur', () => {
    it('should return 401 when no token is provided', () => {
      requireMonteur(req as Request, res as Response, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
    });

    it('should return 401 when token is invalid', async () => {
      req.cookies = { jwt: 'bad-token' };

      await requireMonteur(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 when user is not monteur/admin/superadmin', async () => {
      // mockUser has roles: [Role.USER] by default
      const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.TOKEN_SECRET!);
      req.cookies = { jwt: token };

      await requireMonteur(req as Request, res as Response, next);
      await new Promise((r) => setTimeout(r, 50));

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Access denied - monteur or admin required',
        code: 'ACCESS_DENIED_MONTEUR',
      });
    });
  });
  // #endregion
});
