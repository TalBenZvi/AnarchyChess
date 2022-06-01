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
import { stat } from "fs";

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
    callback: (status: RegisterStatus) => void
  ) {
    Authentication.mongodbClient.register(
      user,
      (status: RegisterStatus, user: User) => {
        if (status === RegisterStatus.success) {
          Authentication.currentUser = user;
        }
        callback(status);
      }
    );
  }

  static login(
    usernameOrEmail: string,
    password: string,
    callback: (status: LoginStatus) => void
  ) {
    Authentication.mongodbClient.login(
      usernameOrEmail,
      password,
      (status: LoginStatus, user: User) => {
        if (status === LoginStatus.success) {
          Authentication.currentUser = user;
        }
        callback(status);
      }
    );
  }

  static createLobby(
    lobbyParams: LobbyParams,
    callback: (status: LobbyCreationStatus) => void
  ) {
    Authentication.mongodbClient.createLobby(
      lobbyParams,
      async (status: LobbyCreationStatus, gameID: string) => {
        let connectionStatus: LobbyCreationStatus = status;
        if (status === LobbyCreationStatus.success) {
          Authentication.serverFlowEngine = new ServerFlowEngine();
          Authentication.serverFlowEngine.acceptConnections(gameID);
          Authentication.clientFlowEngine = new ClientFlowEngine(
            Authentication.currentUser
          );
          let isConnectionSuccessfull: boolean = await Authentication.clientFlowEngine.attemptToConnect(
            gameID,
            0
          );
          if (!isConnectionSuccessfull) {
            Authentication.clientFlowEngine.destroyConnection();
            Authentication.clientFlowEngine = null as any;
            Authentication.serverFlowEngine.destroyConnections();
            Authentication.serverFlowEngine = null as any;
            connectionStatus = LobbyCreationStatus.connectionError;
          }
        }
        callback(connectionStatus);
      }
    );
  }

  static getLobbies(callback: (lobbies: Lobby[]) => void) {
    if (Authentication.currentUser != null) {
      Authentication.mongodbClient.getLobbies(
        Authentication.currentUser.id,
        callback
      );
    }
  }

  static joinLobby(
    lobbyID: string,
    callback: (status: LobbyJoiningStatus) => void
  ) {
    Authentication.mongodbClient.joinLobby(
      Authentication.currentUser.id,
      lobbyID,
      async (status: LobbyJoiningStatus, serverIndex: number) => {
        let connectionStatus: LobbyJoiningStatus = status;
        if (status === LobbyJoiningStatus.success) {
          Authentication.clientFlowEngine = new ClientFlowEngine(
            Authentication.currentUser
          );
          let isConnectionSuccessfull = await Authentication.clientFlowEngine.attemptToConnect(
            lobbyID,
            serverIndex
          );
          if (!isConnectionSuccessfull) {
            Authentication.clientFlowEngine.destroyConnection();
            Authentication.clientFlowEngine = null as any;
            connectionStatus = LobbyJoiningStatus.connectionError;
          }
        }
        callback(connectionStatus);
      }
    );
  }

  static updateLobbyMembers(lobbyID: string, memberIDs: string[]) {
    Authentication.mongodbClient.updateLobbyMembers(lobbyID, memberIDs);
  }

  static closeLobby() {
    if (Authentication.serverFlowEngine != null) {
      Authentication.serverFlowEngine.destroyConnections();
    }
    Authentication.serverFlowEngine = null as any;
  }

  static leaveLobby() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.destroyConnection();
    }
    Authentication.clientFlowEngine = null as any;
  }
}
