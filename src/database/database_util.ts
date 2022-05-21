export interface User {
  id: string;
  username?: string;
  email?: string;
  password?: string;
}

export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

export enum RegisterStatus {
  success,
  usernameTaken,
  emailRegistered,
  connectionError,
}

export interface RegisterResponse {
  status: RegisterStatus;
  user: User;
}

export enum LoginStatus {
  success,
  failure,
  connectionError,
}

export interface LoginResponse {
  status: LoginStatus;
  user: User;
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
  gameID: string;
}