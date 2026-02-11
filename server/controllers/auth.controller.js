const UserModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { signUpErrors, signInErrors } = require("../errors.utils");

// Durée de vie du token
const maxAge = 3 * 21 * 60 * 60 * 1000;

// Création d'un token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.TOKEN_SECRET, {
    expiresIn: maxAge,
  });
};

// S'enregistrer
module.exports.signUp = async (req, res) => {
  console.log(req.body);
  const { pseudo, email, password } = req.body;

  try {
    const user = await UserModel.create({ pseudo, email, password });
    res.status(200).json({ user: user._id });
  } catch (err) {
    const errors = signUpErrors(err);
    res.status(201).send({ errors });
  }
};

// Connexion
module.exports.signIn = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await UserModel.login(email, password);
    const token = createToken(user.id);
    res.cookie("jwt", token, {
      httpOnly: true,
      maxAge,
      secure: true,
      sameSite: "None",
    });
    res.status(200).json({ user: user._id, role: user.role });
  } catch (err) {
    const errors = signInErrors(err);
    res.status(400).json({ errors });
  }
};

// Déconnexion
module.exports.logout = async (req, res) => {
  res.cookie("jwt", "", { maxAge: 1 });
  res.status(200).json({ message: "Déconnexion réussie" });
};
