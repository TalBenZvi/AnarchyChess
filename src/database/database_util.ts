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

export function covertDatabaseLobby(databaseLobby: any): Lobby {
  return {
    id: databaseLobby["_id"],
    name: databaseLobby["name"],
    creatorName: databaseLobby["creatorName"],
    password: databaseLobby["password"],
    areTeamsPrearranged: databaseLobby["areTeamsPrearranged"],
    memberIDs: databaseLobby["memberIDs"],
  } as Lobby;
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
  createdLobby: Lobby;
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
