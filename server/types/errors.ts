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
  name: string;
  supplier: string;
  status: string;
  quantity: string;
}

export interface MongoError extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}
