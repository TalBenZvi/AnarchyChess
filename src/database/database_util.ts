export interface User {
  username: string;
  email: string;
  password?: string;
}

export enum RegisterStatus {
  success,
  usernameTaken,
  emailRegistered,
  connectionError,
}

export interface RegisterResponse {
  status: RegisterStatus;
  userID: string;
}

export enum LoginStatus {
  success,
  failure,
  connectionError,
}

export interface LoginResponse {
  status: LoginStatus;
  userID: string;
}

export interface LobbyParams {
  creatorID: string,
  name: string,
}

export enum LobbyCreationStatus {
  success,
  nameTaken,
  connectionError,
}

export interface LobbyCreationResponse {
  status: LobbyCreationStatus;
}