import type {
  SignUpError,
  SignInError,
  UploadError,
  CreateItemError,
  MongoError,
} from "./types/errors";

// Sign-up validation errors
export const signUpErrors = (err: MongoError): SignUpError => {
  const errors: SignUpError = { username: "", email: "", password: "" };

  if (err.message.includes("username"))
    errors.username = "Pseudo incorrect ou déjà pris";
  if (err.message.includes("email")) errors.email = "Email incorrect";
  if (err.message.includes("password"))
    errors.password = "Le mot de passe doit faire 6 caractères minimum";
  if (err.code === 11000 && Object.keys(err.keyValue!)[0].includes("username"))
    errors.username = "Ce pseudo est déjà pris";
  if (err.code === 11000 && Object.keys(err.keyValue!)[0].includes("email"))
    errors.email = "Cet email est déjà enregistré";

  return errors;
};

// Sign-in validation errors
// Same generic message regardless of which check failed, to avoid
// leaking whether an email is registered (account enumeration).
export const signInErrors = (err: Error): SignInError => {
  const errors: SignInError = { email: "", password: "" };

  if (err.message.includes("email") || err.message.includes("password")) {
    errors.email = "Email ou mot de passe incorrect";
    errors.password = "Email ou mot de passe incorrect";
  }

  return errors;
};

// Upload image error handler
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

// Item creation validation errors
export const createItemErrors = (err: Error): CreateItemError => {
  const errors: CreateItemError = {
    name: "",
    supplier: "",
    status: "",
    quantity: "",
  };

  if (err.message.includes("name"))
    errors.name = "Dénomination incorrect ou déjà prise";
  if (err.message.includes("supplier"))
    errors.supplier = "Nommez un fournisseur valide";
  if (err.message.includes("status"))
    errors.status = "L'état de la pièce doit être NEW ou RMA";
  if (err.message.includes("quantity"))
    errors.quantity = "La quantité attendue est un nombre";

  console.error(err);
  return errors;
};
