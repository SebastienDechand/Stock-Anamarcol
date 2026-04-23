import { Request, Response } from "express";
import UserModel from "../models/user.model";
import jwt from "jsonwebtoken";
import { signUpErrors, signInErrors } from "../errors.utils";
import { JWT_MAX_AGE, COOKIE_MAX_AGE, Role } from "../constants";
import { logEvent } from "../utils/audit.utils";

// Create a JWT token
const createToken = (id: string): string => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET as string, {
    expiresIn: JWT_MAX_AGE,
  });
};

// Sign up
export const signUp = async (req: Request, res: Response): Promise<void> => {
  const { pseudo, email, password, poste, numero, pole } = req.body;

  try {
    const payload: Record<string, unknown> = {
      pseudo,
      email,
      password,
      poste,
      numero,
      pole,
    };
    if (pole === "Hotline") {
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
      await logEvent("login", "user", user._id.toString(), user.pseudo);
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
  res.status(200).json({ message: "Déconnexion réussie" });
};
