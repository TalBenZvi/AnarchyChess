export enum RegisterStatus {
  success,
  usernameTaken,
  emailRegistered,
  connectionError,
}

export interface User {
  username: string;
  email: string;
  password?: string;
}
