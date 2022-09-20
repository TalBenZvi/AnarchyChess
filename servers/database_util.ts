import {
  User,
  Lobby,
  LoginStatus,
  RegisterStatus,
  LobbyCreationStatus,
} from "../src/communication/communication_util.js";

// util
// export function covertDatabaseLobby(databaseLobby: any): Lobby {
//   return {
//     id: databaseLobby["_id"],
//     name: databaseLobby["name"],
//     creatorName: databaseLobby["creatorName"],
//     password: databaseLobby["password"],
//     areTeamsPrearranged: databaseLobby["areTeamsPrearranged"],
//     memberIDs: databaseLobby["memberIDs"],
//   } as Lobby;
// }

// register
export interface RegisterResponse {
  status: RegisterStatus;
  user: User;
}

// login
export interface LoginResponse {
  status: LoginStatus;
  user: User;
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
