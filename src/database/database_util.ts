import { User, RegisterStatus } from "../communication/communication_util.js";

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

export interface RegisterResponse {
  status: RegisterStatus;
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
