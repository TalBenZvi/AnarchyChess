import {
  User,
  Lobby,
  RegisterParams,
  RegisterStatus,
  LoginStatus,
  LobbyParams,
  LobbyCreationStatus,
  LobbyJoiningStatus,
} from "./database_util";
import { MongodbClient } from "../database/mongodb_client";
import { ServerFlowEngine } from "../server_side/server_flow_engine";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

export class Authentication {
  //static currentUser: User = null as any;
  
  static currentUser: User = {
    id: "627c0e2c5573d5400492587f",
    username: "admin",
    email: "talbz03@gmail.com",
  };
  
  static mongodbClient: MongodbClient = new MongodbClient();
  static serverFlowEngine: ServerFlowEngine;
  static clientFlowEngine: ClientFlowEngine;

  static logout() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.destroyConnection();
    }
    Authentication.clientFlowEngine = null as any;
    if (Authentication.serverFlowEngine != null) {
      Authentication.serverFlowEngine.destroyConnections();
    }
    Authentication.serverFlowEngine = null as any;
    Authentication.currentUser = null as any;
  }

  static register(
    user: RegisterParams,
    callback: (isSuccessfull: boolean, status: RegisterStatus) => void
  ) {
    Authentication.mongodbClient.register(
      user,
      (isSuccessfullClient: boolean, status: RegisterStatus, user: User) => {
        if (status === RegisterStatus.success) {
          Authentication.currentUser = user;
        }
        callback(isSuccessfullClient, status);
      }
    );
  }

  static login(
    usernameOrEmail: string,
    password: string,
    callback: (isSuccessfull: boolean, status: LoginStatus) => void
  ) {
    Authentication.mongodbClient.login(
      usernameOrEmail,
      password,
      (isSuccessfullClient: boolean, status: LoginStatus, user: User) => {
        if (status === LoginStatus.success) {
          Authentication.currentUser = user;
        }
        callback(isSuccessfullClient, status);
      }
    );
  }

  static createLobby(
    lobbyParams: LobbyParams,
    callback: (isSuccessfull: boolean, status: LobbyCreationStatus) => void
  ) {
    Authentication.mongodbClient.createLobby(
      lobbyParams,
      async (
        isSuccessfullClient: boolean,
        status: LobbyCreationStatus,
        gameID: string
      ) => {
        if (status === LobbyCreationStatus.success) {
          Authentication.serverFlowEngine = new ServerFlowEngine();
          Authentication.serverFlowEngine.acceptConnections(gameID);
          Authentication.clientFlowEngine = new ClientFlowEngine(
            Authentication.currentUser.id
          );
          Authentication.clientFlowEngine.targetServerIndex = 0;
          await Authentication.clientFlowEngine.attemptToConnect(gameID);
        }
        callback(isSuccessfullClient, status);
      }
    );
  }

  static getLobbies(callback: (lobbies: Lobby[]) => void) {
    if (Authentication.currentUser != null) {
      Authentication.mongodbClient.getLobbies(Authentication.currentUser.id, callback);
    }
  }

  static joinLobby(
    lobbyID: string,
    callback: (isSuccessfull: boolean, status: LobbyJoiningStatus) => void
  ) {
    Authentication.mongodbClient.joinLobby(
      Authentication.currentUser.id,
      lobbyID,
      async (
        isSuccessfullClient: boolean,
        status: LobbyJoiningStatus,
        serverIndex: number
      ) => {
        if (status === LobbyJoiningStatus.success) {
          Authentication.clientFlowEngine = new ClientFlowEngine(
            Authentication.currentUser.id
          );
          Authentication.clientFlowEngine.targetServerIndex = serverIndex;
          await Authentication.clientFlowEngine.attemptToConnect(lobbyID);
        }
        callback(isSuccessfullClient, status);
      }
    );
  }

  static leaveLobby() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.destroyConnection();
    }
    Authentication.clientFlowEngine = null as any;
  }

  static updateLobbyMembers(lobbyID: string, memberIDs: string[]) {
    Authentication.mongodbClient.updateLobbyMembers(lobbyID, memberIDs);
  }
}
