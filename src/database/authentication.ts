import {
  Lobby,
  LobbyParams,
  LobbyCreationStatus,
  LobbyJoiningStatus,
} from "./database_util";
import { MongodbClient } from "../database/mongodb_client";
import { ServerFlowEngine } from "../server_side/server_flow_engine";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { User } from "../communication/communication_util";

export class Authentication {
  static currentUser: User = null as any;

  static mongodbClient: MongodbClient = new MongodbClient();
  static serverFlowEngine: ServerFlowEngine = null as any;
  static clientFlowEngine: ClientFlowEngine = null as any;

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

  static createLobby(
    lobbyParams: LobbyParams,
    callback: (status: LobbyCreationStatus) => void
  ) {
    Authentication.mongodbClient.createLobby(
      lobbyParams,
      async (status: LobbyCreationStatus, createdLobby: Lobby) => {
        if (status === LobbyCreationStatus.success) {
          Authentication.serverFlowEngine = new ServerFlowEngine();
          Authentication.serverFlowEngine.acceptConnections(createdLobby);
          Authentication.clientFlowEngine = new ClientFlowEngine(
            Authentication.currentUser
          );
          Authentication.clientFlowEngine.attemptToConnect(createdLobby, 0, {
            onSuccess: () => {
              callback(LobbyCreationStatus.success);
            },
            onFailure: () => {
              Authentication.clientFlowEngine.destroyConnection();
              Authentication.clientFlowEngine = null as any;
              Authentication.serverFlowEngine.destroyConnections();
              Authentication.serverFlowEngine = null as any;
              callback(LobbyCreationStatus.connectionError);
            },
          });
        }
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
    lobby: Lobby,
    callback: (status: LobbyJoiningStatus) => void
  ) {
    Authentication.mongodbClient.joinLobby(
      Authentication.currentUser.id,
      lobby.id,
      (status: LobbyJoiningStatus, serverIndex: number) => {
        if (status === LobbyJoiningStatus.success) {
          Authentication.clientFlowEngine = new ClientFlowEngine(
            Authentication.currentUser
          );
          Authentication.clientFlowEngine.attemptToConnect(lobby, serverIndex, {
            onSuccess: () => {
              callback(LobbyJoiningStatus.success);
            },
            onFailure: () => {
              Authentication.clientFlowEngine.destroyConnection();
              Authentication.clientFlowEngine = null as any;
              callback(LobbyJoiningStatus.connectionError);
            },
          });
        }
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
