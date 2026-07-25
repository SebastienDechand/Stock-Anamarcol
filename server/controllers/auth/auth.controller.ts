import { Request, Response } from "express";
import UserModel from "../../models/user.model";
import jwt from "jsonwebtoken";
import { signUpErrors, signInErrors } from "../../utils/errors/errors.utils";
import { JWT_MAX_AGE, COOKIE_MAX_AGE, Role } from "../../constants";
import { logEvent } from "../../utils/audit/audit.utils";
import { ErrorCode } from "../../constants/errorCodes";

// Create a JWT token
const createToken = (id: string): string => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET as string, {
    expiresIn: JWT_MAX_AGE,
  });
};

// Sign up
export const signUp = async (req: Request, res: Response): Promise<void> => {
  const { username, email, password, position, phone, department } =
    req.body;

  try {
    const payload: Record<string, unknown> = {
      username,
      email,
      password,
      position,
      phone,
      department,
    };
    if (department === "Hotline") {
      payload.roles = [Role.USER, Role.HOTLINE];
    } else {
      payload.roles = [Role.USER];
    }
    const user = await UserModel.create(payload);
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = signUpErrors(
      err as Error & { code?: number; keyValue?: Record<string, unknown> },
    );
    res.status(400).json({ errors });
  }
};

// Sign in
export const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user._id.toString());
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: COOKIE_MAX_AGE,
      secure: true,
      sameSite: "lax",
    });
    // Audit: login
    try {
      await logEvent("login", "user", user._id.toString(), user.username);
    } catch (err) {
      console.error("Audit login error:", err);
    }
    const effectiveRoles: string[] =
      user.roles && user.roles.length > 0 ? user.roles : [Role.USER];
    res.status(200).json({ user: user._id, roles: effectiveRoles });
  } catch (err) {
    const errors = signInErrors(err as Error);
    res.status(400).json({ errors });
  }
};

// Sign out
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.cookie("jwt", "", { maxAge: 1 });
  res
    .status(200)
    .json({ message: "Logged out successfully", code: ErrorCode.LOGOUT_SUCCESS });
};
