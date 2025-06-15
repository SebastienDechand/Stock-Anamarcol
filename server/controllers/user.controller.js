const UserModel = require("../models/user.model");
const ObjectID = require("mongoose").Types.ObjectId;

// Retourne tous les utilisateurs enregistrés
module.exports.getAllUsers = async (req, res) => {
  const users = await UserModel.find().select("-password");
  res.status(200).json(users);
};

// Retourne les infos d'un utilisateur par son id
// sans le mot de passe
module.exports.userInfo = (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  UserModel.findById(req.params.id)
    .select("-password")
    .then((docs) => {
      if (!docs) {
        res.status(404).send("User not found");
      } else {
        res.send(docs);
      }
    })
    .catch((err) => {
      console.error("ID Unknown : " + err);
      res.status(500).send("Internal Server Error");
    });
};

// Mise à jour d'un utilisateur
// email, password, poste, numéron image
module.exports.updateUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  try {
    const user = await UserModel.findById(req.params.id);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Mettre à jour les champs individuellement en respectant les middlewares
    if (req.body.email) user.email = req.body.email;
    if (req.body.password) user.password = req.body.password;
    if (req.body.poste) user.poste = req.body.poste;
    if (req.body.numero) user.numero = req.body.numero;
    if (req.body.picture) user.picture = req.body.picture;

    const updatedUser = await user.save();

    return res.send(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};

// Suppression d'un utilisateur
module.exports.deleteUser = async (req, res) => {
  if (!ObjectID.isValid(req.params.id))
    return res.status(400).send("ID Unknown : " + req.params.id);

  try {
    await UserModel.deleteOne({ _id: req.params.id }).exec();
    res.status(200).json({ message: "Sucessfully deleted." });
  } catch (err) {
    console.error("Error deleting user:", err);
    return res
      .status(500)
      .json({ message: err.message || "Internal Server Error" });
  }
};
