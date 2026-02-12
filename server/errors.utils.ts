interface SignUpError {
  pseudo: string;
  email: string;
  password: string;
}

interface SignInError {
  email: string;
  password: string;
}

interface UploadError {
  format: string;
  maxSize: string;
}

interface CreateItemError {
  denomination: string;
  fournisseur: string;
  etat: string;
  quantite: string;
}

interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

// Erreurs pendant le log in
export const signUpErrors = (err: MongoError): SignUpError => {
  const errors: SignUpError = { pseudo: "", email: "", password: "" };

  if (err.message.includes("pseudo"))
    errors.pseudo = "Pseudo incorrect ou déjà pris";
  if (err.message.includes("email")) errors.email = "Email incorrect";
  if (err.message.includes("password"))
    errors.password = "Le mot de passe doit faire 6 caractères minimum";
  if (err.code === 11000 && Object.keys(err.keyValue!)[0].includes("pseudo"))
    errors.pseudo = "Ce pseudo est déjà pris";
  if (err.code === 11000 && Object.keys(err.keyValue!)[0].includes("email"))
    errors.email = "Cet email est déjà enregistré";

  return errors;
};

// Erreur pendant la connexion
export const signInErrors = (err: Error): SignInError => {
  const errors: SignInError = { email: "", password: "" };

  if (err.message.includes("email")) errors.email = "Email inconnu";
  if (err.message.includes("password"))
    errors.password = "Le mot de passe ne correspond pas";

  return errors;
};

// Fonction pour gérer les erreurs lors de l'upload d'image
export const uploadErrors = (
  err: Error,
  detectedMimeType?: string | null,
  fileName?: string,
): UploadError => {
  const errors: UploadError = { format: "", maxSize: "" };

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
export const createItemErrors = (err: Error): CreateItemError => {
  const errors: CreateItemError = {
    denomination: "",
    fournisseur: "",
    etat: "",
    quantite: "",
  };

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
