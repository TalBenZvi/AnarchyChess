import {
  User,
  Lobby,
  WSResponseStatus,
} from "../../src/communication/communication_util.js";

// register
export interface RegisterResponse {
  status: WSResponseStatus;
  user: User;
}

// login
export interface LoginResponse {
  status: WSResponseStatus;
  user: User;
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
