export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
}

export interface Lobby {
  id: string;
  name: string;
  creatorName: string;
  password: string;
  areTeamsPrearranged: boolean;
  memberIDs: string[];
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
  creatorID: string;
  creatorName: string;
  name: string;
  password: string;
  areTeamsPrearranged: boolean;
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

export enum LobbyJoiningStatus {
  success,
  failure,
  connectionError,
}

export interface LobbyJoiningResponse {
  status: LobbyJoiningStatus;
  serverIndex: number;
}
