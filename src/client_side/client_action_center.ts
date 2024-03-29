import { NewLifecycle } from "react";
import {
  EnvironmentManager,
  ValueType,
  WSResponseStatus,
  User,
  reviver,
  WSResponse,
  WSRequestType,
  WSResponseInfo,
  WSRequest,
  replacer,
  LoginParams,
  RegisterParams,
  LobbyCreationParams,
  Lobby,
  GameEvent,
  MoveRequestParams,
  LobbyJoiningParams,
  LobbyRemovalParams,
  ChangeTeamParams,
} from "../communication/communication_util";
import { Move } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "./client_flow_engine";

// in seconds
const RESPONSE_TIMEOUT: number = 10;

export class ClientActionCenter {
  private static instance: ClientActionCenter = null as any;

  private wsClient: WebSocket = null as any;
  private _currentUser: User = null as any;
  private _currentLobby: Lobby = null as any;
  private _clientFlowEngine: ClientFlowEngine = null as any;

  // on-response functions
  private onRegisterResponse: (status: WSResponseStatus, user: User) => void =
    null as any;
  private onLoginResponse: (status: WSResponseStatus, user: User) => void =
    null as any;
  private onGetLobbiesResponse: (lobbies: Lobby[]) => void = null as any;
  private onLobbyCreationResponse: (
    status: WSResponseStatus,
    newLobby: Lobby
  ) => void = null as any;
  private onJoinLobbyResponse: (
    status: WSResponseStatus,
    newLobby: Lobby
  ) => void = null as any;

  //timeouts
  private registerTimeout: any = null;
  private loginTimeout: any = null;
  private lobbyCreationTimeout: any = null;
  private joinLobbyTimeout: any = null;

  static getInstance() {
    if (ClientActionCenter.instance == null) {
      ClientActionCenter.instance = new ClientActionCenter();
    }
    return ClientActionCenter.instance;
  }

  private constructor() {
    this.wsClient = new WebSocket(
      EnvironmentManager.getValue(ValueType.wssAddress)
    );
    this.wsClient.addEventListener("message", (event) => {
      let wsResponse: WSResponse = JSON.parse(event.data.toString(), reviver);
      switch (wsResponse.type) {
        // register
        case WSRequestType.register:
          {
            clearTimeout(this.registerTimeout);
            let user = wsResponse.info.get(WSResponseInfo.user);
            if (wsResponse.status === WSResponseStatus.success) {
              this.onAuthentication(user);
            }
            if (this.onRegisterResponse !== null) {
              this.onRegisterResponse(
                wsResponse.status as WSResponseStatus,
                user
              );
              this.onRegisterResponse = null as any;
            }
          }
          break;
        // login
        case WSRequestType.login:
          {
            clearTimeout(this.loginTimeout);
            let user = wsResponse.info.get(WSResponseInfo.user);
            if (wsResponse.status === WSResponseStatus.success) {
              this.onAuthentication(user);
            }
            if (this.onLoginResponse !== null) {
              this.onLoginResponse(wsResponse.status as WSResponseStatus, user);
              this.onLoginResponse = null as any;
            }
          }
          break;
        // get lobbies
        case WSRequestType.getLobbies:
          {
            if (this.onGetLobbiesResponse !== null) {
              this.onGetLobbiesResponse(
                wsResponse.info.get(WSResponseInfo.lobbies)
              );
              this.onGetLobbiesResponse = null as any;
            }
          }
          break;
        // create lobby
        case WSRequestType.createLobby:
          {
            clearTimeout(this.lobbyCreationTimeout);
            let newLobby = wsResponse.info.get(WSResponseInfo.newLobby);
            if (wsResponse.status === WSResponseStatus.success) {
              this._currentLobby = newLobby;
              this.clientFlowEngine.setLobby(
                newLobby,
                wsResponse.info.get(WSResponseInfo.playerListJSON)
              );
            }
            if (this.onLobbyCreationResponse != null) {
              this.onLobbyCreationResponse(
                wsResponse.status as WSResponseStatus,
                newLobby
              );
              this.onLobbyCreationResponse = null as any;
            }
          }
          break;
        // join lobby
        case WSRequestType.joinLobby:
          {
            clearTimeout(this.joinLobbyTimeout);
            let newLobby = wsResponse.info.get(WSResponseInfo.newLobby);
            if (wsResponse.status === WSResponseStatus.success) {
              this._currentLobby = newLobby;
              this.clientFlowEngine.setLobby(
                newLobby,
                wsResponse.info.get(WSResponseInfo.playerListJSON)
              );
            }
            if (this.onJoinLobbyResponse != null) {
              this.onJoinLobbyResponse(
                wsResponse.status as WSResponseStatus,
                newLobby
              );
              this.onJoinLobbyResponse = null as any;
            }
          }
          break;
        case WSRequestType.inGame:
          {
            let gameEvent: GameEvent = wsResponse.info.get(
              WSResponseInfo.gameEvent
            );
            this._clientFlowEngine.registerEvent(gameEvent);
          }
          break;
      }
    });
  }

  get currentUser(): User {
    return this._currentUser;
  }

  get currentLobby(): Lobby {
    return this._currentLobby;
  }

  get clientFlowEngine(): ClientFlowEngine {
    return this._clientFlowEngine;
  }

  private onAuthentication(user: User): void {
    this._currentUser = user;
    this._clientFlowEngine = new ClientFlowEngine(user, (move: Move) => {
      this.sendRequest({
        type: WSRequestType.inGame,
        params: {
          move: move,
        } as MoveRequestParams,
      } as WSRequest);
    });
  }

  private sendRequest(request: WSRequest) {
    this.wsClient.send(JSON.stringify(request, replacer));
  }

  register(
    registerParams: RegisterParams,
    onResponse: (status: WSResponseStatus, user: User) => void
  ): void {
    this.onRegisterResponse = onResponse;
    this.sendRequest({
      type: WSRequestType.register,
      params: registerParams,
    } as WSRequest);
    this.registerTimeout = setTimeout(() => {
      onResponse(WSResponseStatus.connectionError, null as any);
    }, RESPONSE_TIMEOUT * 1000);
  }

  login(
    loginParams: LoginParams,
    onResponse: (status: WSResponseStatus, user: User) => void
  ): void {
    this.onLoginResponse = onResponse;
    this.sendRequest({
      type: WSRequestType.login,
      params: loginParams,
    } as WSRequest);
    this.loginTimeout = setTimeout(() => {
      onResponse(WSResponseStatus.connectionError, null as any);
    }, RESPONSE_TIMEOUT * 1000);
  }

  logout(): void {
    this.sendRequest({
      type: WSRequestType.logout,
      params: null as any,
    });
    this._currentUser = null as any;
    this._currentLobby = null as any;
  }

  getLobbies(onResponse: (lobbies: Lobby[]) => void): void {
    this.onGetLobbiesResponse = onResponse;
    this.sendRequest({
      type: WSRequestType.getLobbies,
      params: null as any,
    });
  }

  createLobby(
    lobbyCreationParams: LobbyCreationParams,
    onResponse: (status: WSResponseStatus, newLobby: Lobby) => void
  ): void {
    this.onLobbyCreationResponse = onResponse;
    this.sendRequest({
      type: WSRequestType.createLobby,
      params: lobbyCreationParams,
    });
    this.lobbyCreationTimeout = setTimeout(() => {
      onResponse(WSResponseStatus.connectionError, null as any);
    }, RESPONSE_TIMEOUT * 1000);
  }

  joinLobby(
    lobbyJoiningParams: LobbyJoiningParams,
    onResponse: (status: WSResponseStatus, newLobby: Lobby) => void
  ): void {
    this.onJoinLobbyResponse = onResponse;
    this.sendRequest({
      type: WSRequestType.joinLobby,
      params: lobbyJoiningParams,
    });
    this.joinLobbyTimeout = setTimeout(() => {
      onResponse(WSResponseStatus.connectionError, null as any);
    }, RESPONSE_TIMEOUT * 1000);
  }

  removeFromLobby(lobbyRemovalParams: LobbyRemovalParams): void {
    this.sendRequest({
      type: WSRequestType.removeFromLobby,
      params: lobbyRemovalParams,
    });
  }

  leaveLobby() {
    this.removeFromLobby({
      removedPlayerID: this.currentUser.id,
    });
  }

  changePlayerTeam(changeTeamParams: ChangeTeamParams): void {
    this.sendRequest({
      type: WSRequestType.changePlayerTeam,
      params: changeTeamParams,
    });
  }

  fillLobbyWithBots(): void {
    this.sendRequest({
      type: WSRequestType.fillLobbyWithBots,
      params: null as any,
    });
  }

  removeBotsFromLobby(): void {
    this.sendRequest({
      type: WSRequestType.removeBotsFromLobby,
      params: null as any,
    });
  }

  startGame(): void {
    this.sendRequest({
      type: WSRequestType.startGame,
      params: null as any,
    });
  }

  returnToLobby(): void {
    this.sendRequest({
      type: WSRequestType.returnToLobby,
      params: null as any,
    });
  }
}
