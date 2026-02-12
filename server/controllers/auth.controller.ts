import { Request, Response } from "express";
import UserModel from "../models/user.model";
import jwt from "jsonwebtoken";
import { signUpErrors, signInErrors } from "../errors.utils";
import { TOKEN_MAX_AGE } from "../constants";

// Création d'un token
const createToken = (id: string): string => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET as string, {
    expiresIn: TOKEN_MAX_AGE,
  });
};

// S'enregistrer
export const signUp = async (req: Request, res: Response): Promise<void> => {
  const { pseudo, email, password } = req.body;

  try {
    const user = await UserModel.create({ pseudo, email, password });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = signUpErrors(
      err as Error & { code?: number; keyValue?: Record<string, unknown> },
    );
    res.status(400).json({ errors });
  }
};

// Connexion
export const signIn = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user._id.toString());
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge: TOKEN_MAX_AGE,
      secure: true,
      sameSite: "none",
    });
    res.status(200).json({ user: user._id, role: user.role });
  } catch (err) {
    const errors = signInErrors(err as Error);
    res.status(400).json({ errors });
  }
};

// Déconnexion
export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.status(200).json({ message: "Déconnexion réussie" });
};
