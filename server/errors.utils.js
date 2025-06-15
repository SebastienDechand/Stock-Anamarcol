// Erreurs pendant le log in
module.exports.signUpErrors = (err) => {
  let errors = { pseudo: "", email: "", password: "" };

  if (err.message.includes("pseudo"))
    errors.pseudo = "Pseudo incorrect ou déjà pris";
  if (err.message.includes("email")) errors.email = "Email incorrect";
  if (err.message.includes("password"))
    errors.password = "Le mot de passe doit faire 6 caractères minimum";
  if (err.code === 11000 && Object.keys(err.keyValue)[0].includes("pseudo"))
    errors.pseudo = "Ce pseudo est déjà pris";
  if (err.code === 11000 && Object.keys(err.keyValue)[0].includes("email"))
    errors.email = "Cet email est déjà enregistré";

  return errors;
};

// Erreur pendant la connexion
module.exports.signInErrors = (err) => {
  let errors = { email: "", password: "" };

  if (err.message.includes("email")) errors.email = "Email inconnu";
  if (err.message.includes("password"))
    errors.password = "Le mot de passe ne correspond pas";

  return errors;
};

// Fonction pour gérer les erreurs lors de l'upload d'image
module.exports.uploadErrors = (err, detectedMimeType, fileName) => {
  let errors = { format: "", maxSize: "" };

  if (err.message.includes("Invalid file")) {
    const detectedMimeMessage = detectedMimeType
      ? `Detected MIME type: ${detectedMimeType}.`
      : "";
    errors.format = `Format incompatible. ${detectedMimeMessage} `;
  }

  if (err.message.includes("Max size")) {
    errors.maxSize = "Le fichier est trop volumineux, maximum 2.5Mo";
  }

  console.error("Detected MIME Type:", detectedMimeType);
  console.error("File Name:", fileName);

  return errors;
};

// Erreurs pendant la création d'article
module.exports.createItemErrors = (err) => {
  let errors = { denomination: "", fournisseur: "", etat: "", quantite: "" };

  if (err.message.includes("denomination"))
    errors.denomination = "Dénomination incorrect ou déjà prise";
  if (err.message.includes("fournisseur"))
    errors.fournisseur = "Nommez un fournisseur valide";
  if (err.message.includes("etat"))
    errors.etat = "L'état de la pièce doit être Neuf ou SAV";
  if (err.message.includes("quantite"))
    errors.quantite = "La quantité attendue est un nombre";

  console.error(err);
  return errors;
};
