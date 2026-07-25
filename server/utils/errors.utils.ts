import type {
  SignUpError,
  SignInError,
  UploadError,
  CreateItemError,
  MongoError,
} from "../types/errors";

// Sign-up validation errors
export const signUpErrors = (err: MongoError): SignUpError => {
  const errors: SignUpError = { username: "", email: "", password: "" };

  if (err.message.includes("username"))
    errors.username = "Invalid or already taken username";
  if (err.message.includes("email")) errors.email = "Invalid email";
  if (err.message.includes("password"))
    errors.password = "Password must be at least 6 characters";
  if (err.code === 11000 && Object.keys(err.keyValue!)[0].includes("username"))
    errors.username = "This username is already taken";
  if (err.code === 11000 && Object.keys(err.keyValue!)[0].includes("email"))
    errors.email = "This email is already registered";

  return errors;
};

// Sign-in validation errors
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
    errors.format = `Unsupported file format. ${detectedMimeMessage} `;
  }

  if (err.message.includes("Max size")) {
    errors.maxSize = "File is too large, maximum 2.5MB";
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
    errors.name = "Invalid or already taken name";
  if (err.message.includes("supplier"))
    errors.supplier = "Enter a valid supplier";
  if (err.message.includes("status"))
    errors.status = "Status must be NEW or RMA";
  if (err.message.includes("quantity"))
    errors.quantity = "Quantity must be a number";

  console.error(err);
  return errors;
};
