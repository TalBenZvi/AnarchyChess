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
  WSResponseStatus,
  User,
  Lobby,
  RegisterParams,
  LobbyCreationParams,
  MoveRequestParams,
  LobbyJoiningParams,
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
            case WSRequestType.register:
              {
                this.register(client, request.params as RegisterParams);
              }
              break;
            case WSRequestType.login:
              {
                this.login(client, request.params as LoginParams);
              }
              break;
            case WSRequestType.getLobbies:
              {
                this.sendResponse(client, {
                  type: WSRequestType.getLobbies,
                  status: null as any,
                  info: new Map([
                    [WSResponseInfo.lobbies, this.lobbies as any],
                  ]),
                });
              }
              break;
            case WSRequestType.createLobby:
              {
                this.createLobby(client, request.params as LobbyCreationParams);
              }
              break;
            case WSRequestType.joinLobby:
              {
                this.joinLobby(client, request.params as LobbyJoiningParams);
              }
              break;
            case WSRequestType.inGame:
              {
                (
                  this.serverAssignments.get(getUser(client).id) as GameServer
                ).handleMoveRequest(
                  (request.params as MoveRequestParams).move,
                  getUser(client).id
                );
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
    MongodbOperations.login(
      loginParams,
      (status: WSResponseStatus, user: User) => {
        if (status === WSResponseStatus.success) {
          setUser(client, user);
          this.serverAssignments.set(user.id, null as any);
        }
        this.sendResponse(client, {
          type: WSRequestType.login,
          status: status,
          info: new Map<WSResponseInfo, any>([[WSResponseInfo.user, user]]),
        } as WSResponse);
      }
    );
  }

  private register(client: any, registerParams: RegisterParams): void {
    MongodbOperations.register(
      registerParams,
      (status: WSResponseStatus, user: User) => {
        if (status === WSResponseStatus.success) {
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
    let status: WSResponseStatus = WSResponseStatus.success;
    let newLobby: Lobby = null as any;
    let playerListJSON: string = null as any;
    for (let lobby of this.lobbies) {
      if (lobby.name === lobbyCreationParams.name) {
        status = WSResponseStatus.nameTaken;
      }
    }
    if (status === WSResponseStatus.success) {
      newLobby = {
        creatorID: creator.id,
        name: lobbyCreationParams.name,
        creatorName: creator.username,
        password: lobbyCreationParams.password,
        areTeamsPrearranged: lobbyCreationParams.areTeamsPrearranged,
        capacity: 0,
      };
      let gameServer = new GameServer(getUser(client), client, newLobby);
      this.serverAssignments.set(creator.id, gameServer);
      this.lobbies.push(newLobby);
      playerListJSON = gameServer.getPlayerListJSON();
    }
    this.sendResponse(client, {
      type: WSRequestType.createLobby,
      status: status,
      info: new Map<WSResponseInfo, any>([
        [WSResponseInfo.newLobby, newLobby],
        [WSResponseInfo.playerListJSON, playerListJSON],
      ]),
    } as WSResponse);
  }

  private joinLobby(client: any, lobbyJoiningParams: LobbyJoiningParams) {
    let gameServer: GameServer = this.serverAssignments.get(
      lobbyJoiningParams.lobbyCreatorID
    ) as GameServer;
    let isSuccessfull: boolean = gameServer.addClient(getUser(client), client);
    if (isSuccessfull) {
      this.serverAssignments.set(getUser(client).id, gameServer);
    }
    this.sendResponse(client, {
      type: WSRequestType.joinLobby,
      status: isSuccessfull
        ? WSResponseStatus.success
        : WSResponseStatus.failure,
      info: new Map([
        [
          WSResponseInfo.newLobby,
          isSuccessfull ? (gameServer.lobby as any) : (null as any),
        ],
        [
          WSResponseInfo.playerListJSON,
          isSuccessfull
            ? (gameServer.getPlayerListJSON() as any)
            : (null as any),
        ],
      ]),
    });
  }
}
