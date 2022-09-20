import { WebSocketServer } from "ws";

import {
  replacer,
  reviver,
  WSRequest,
  WSRequestType,
  WSResponse,
  WSResponseInfo,
  WSS_PATH,
  LoginParams,
  LoginStatus,
  User,
  Lobby,
  RegisterParams,
  RegisterStatus,
  LobbyCreationParams,
  LobbyCreationStatus,
} from "../src/communication/communication_util.js";
import { MongodbOperations } from "./mongodb_operations.js";
import { GameServer } from "./game_server.js";

const getUser = (client: any): User => {
  return client.user;
};

const setUser = (client: any, user: User): void => {
  client.user = user;
};

export class AppServer {
  private wss;
  // serverAssignments[<user_id>] is the server the user is assigned to
  private serverAssignments: Map<string, GameServer> = new Map();
  private lobbies: Lobby[] = [];

  constructor(server: any) {
    this.wss = new WebSocketServer({ server: server, path: WSS_PATH });
    this.wss.on("connection", (client) => {
      setUser(client, null as any);
      client.on("message", (data) => {
        let request: WSRequest = JSON.parse(data.toString(), reviver);
        if (request !== undefined) {
          switch (request.type) {
            case WSRequestType.login:
              {
                this.login(client, request.params as LoginParams);
              }
              break;
            case WSRequestType.register:
              {
                this.register(client, request.params as RegisterParams);
              }
              break;
            case WSRequestType.createLobby:
              {
                this.createLobby(client, request.params as LobbyCreationParams);
              }
              break;
          }
        }
      });
      client.on("close", () => {
        if (getUser(client) != null) {
          this.logout(getUser(client));
        }
      });
    });
  }

  private sendResponse(client: any, response: WSResponse): void {
    client.send(JSON.stringify(response, replacer));
  }

  private login(client: any, loginParams: LoginParams): void {
    MongodbOperations.login(loginParams, (status: LoginStatus, user: User) => {
      if (status === LoginStatus.success) {
        setUser(client, user);
        this.serverAssignments.set(user.id, null as any);
      }
      this.sendResponse(client, {
        type: WSRequestType.login,
        status: status,
        info: new Map<WSResponseInfo, any>([[WSResponseInfo.user, user]]),
      } as WSResponse);
    });
  }

  private register(client: any, registerParams: RegisterParams): void {
    MongodbOperations.register(
      registerParams,
      (status: RegisterStatus, user: User) => {
        if (status === RegisterStatus.success) {
          setUser(client, user);
          this.serverAssignments.set(user.id, null as any);
        }
        this.sendResponse(client, {
          type: WSRequestType.register,
          status: status,
          info: new Map<WSResponseInfo, any>([[WSResponseInfo.user, user]]),
        } as WSResponse);
      }
    );
  }

  private logout(user: User): void {
    this.serverAssignments.delete(user.id);
  }

  private createLobby(
    client: any,
    lobbyCreationParams: LobbyCreationParams
  ): void {
    let creator = getUser(client);
    let status: LobbyCreationStatus = LobbyCreationStatus.success;
    let newLobby: Lobby = null as any;
    for (let lobby of this.lobbies) {
      if (lobby.name === lobbyCreationParams.name) {
        status = LobbyCreationStatus.nameTaken;
      }
    }
    if (status === LobbyCreationStatus.success) {
      newLobby = {
        creatorID: creator.id,
        name: lobbyCreationParams.name,
        creatorName: creator.username,
        password: lobbyCreationParams.password,
        areTeamsPrearranged: lobbyCreationParams.areTeamsPrearranged,
        capacity: 0,
      };
      this.serverAssignments.set(creator.id, new GameServer(client, newLobby));
      this.lobbies.push(newLobby);
    }
    this.sendResponse(client, {
      type: WSRequestType.createLobby,
      status: status,
      info: new Map<WSResponseInfo, any>([[WSResponseInfo.newLobby, newLobby]]),
    } as WSResponse);
  }
}
