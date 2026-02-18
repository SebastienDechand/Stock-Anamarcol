export interface SignUpError {
  pseudo: string;
  email: string;
  password: string;
}

export interface SignInError {
  email: string;
  password: string;
}

export interface UploadError {
  format: string;
  maxSize: string;
}

export interface CreateItemError {
  denomination: string;
  fournisseur: string;
  etat: string;
  quantite: string;
}

export interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}
