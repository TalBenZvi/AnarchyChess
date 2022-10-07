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
  LobbyRemovalParams,
  ChangeTeamParams,
} from "../../src/communication/communication_util.js";
import { MongodbOperations } from "../database_access/mongodb_operations.js";
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
        try {
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
              case WSRequestType.logout:
                {
                  this.logout(client);
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
                  this.createLobby(
                    client,
                    request.params as LobbyCreationParams
                  );
                }
                break;
              case WSRequestType.joinLobby:
                {
                  this.joinLobby(client, request.params as LobbyJoiningParams);
                }
                break;
              case WSRequestType.removeFromLobby:
                {
                  let requesterID: string = getUser(client).id;
                  let removedPlayerID: string = (
                    request.params as LobbyRemovalParams
                  ).removedPlayerID;
                  if (
                    removedPlayerID === requesterID ||
                    this.isHost(requesterID)
                  ) {
                    this.removePlayerFromLobby(requesterID, removedPlayerID);
                  }
                }
                break;
              case WSRequestType.changePlayerTeam:
                {
                  let requesterID: string = getUser(client).id;
                  let playerID: string = (request.params as ChangeTeamParams)
                    .playerID;
                  if (this.isHost(requesterID)) {
                    (
                      this.serverAssignments.get(requesterID) as GameServer
                    ).changePlayerTeam(playerID);
                  }
                }
                break;
              case WSRequestType.fillLobbyWithBots:
                {
                  let requesterID: string = getUser(client).id;
                  if (this.isHost(requesterID)) {
                    (
                      this.serverAssignments.get(requesterID) as GameServer
                    ).fillWithBots();
                  }
                }
                break;
              case WSRequestType.removeBotsFromLobby:
                {
                  let requesterID: string = getUser(client).id;
                  if (this.isHost(requesterID)) {
                    (
                      this.serverAssignments.get(requesterID) as GameServer
                    ).removeAllBots();
                  }
                }
                break;
              case WSRequestType.startGame:
                {
                  let requesterID: string = getUser(client).id;
                  if (this.isHost(requesterID)) {
                    (
                      this.serverAssignments.get(requesterID) as GameServer
                    ).startGame();
                  }
                }
                break;
              case WSRequestType.returnToLobby:
                {
                  let requesterID: string = getUser(client).id;
                  if (this.isHost(requesterID)) {
                    (
                      this.serverAssignments.get(requesterID) as GameServer
                    ).returnToLobby();
                  }
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
        } catch (e) {
          console.error(e);
        }
      });
      client.on("close", () => {
        if (getUser(client) != null) {
          this.logout(client);
        }
      });
    });
  }

  private isHost(userID: string): boolean {
    return (
      this.serverAssignments.has(userID) &&
      (this.serverAssignments.get(userID) as GameServer).lobby.creatorID ===
        userID
    );
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
        }
        this.sendResponse(client, {
          type: WSRequestType.register,
          status: status,
          info: new Map<WSResponseInfo, any>([[WSResponseInfo.user, user]]),
        } as WSResponse);
      }
    );
  }

  private removePlayerFromLobby(requesterID: string, removedPlayerID: string) {
    if (this.serverAssignments.has(requesterID)) {
      let gameServer = this.serverAssignments.get(requesterID) as GameServer;
      let isLobbyClosed: boolean =
        removedPlayerID === gameServer.lobby.creatorID;
      let removedUserIDs: string[] = gameServer.removePlayer(removedPlayerID);
      for (let removedUserID of removedUserIDs) {
        this.serverAssignments.delete(removedUserID);
      }
      if (isLobbyClosed) {
        this.lobbies = this.lobbies.filter(
          (lobby: Lobby) => lobby.creatorID !== removedPlayerID
        );
      }
    }
  }

  private logout(client: any): void {
    this.removePlayerFromLobby(getUser(client).id, getUser(client).id);
    setUser(client, null as any);
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
    let isSuccessfull: boolean = true;
    let gameServer: GameServer = null as any;
    if (this.serverAssignments.has(lobbyJoiningParams.lobbyCreatorID)) {
      gameServer = this.serverAssignments.get(
        lobbyJoiningParams.lobbyCreatorID
      ) as GameServer;
      if (!gameServer.addClient(getUser(client), client)) {
        isSuccessfull = false;
      }
    } else {
      isSuccessfull = false;
    }
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
