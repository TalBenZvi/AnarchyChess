import { Move } from "../game_flow_util/game_elements";

// constants
export const WEBSITE_DOMAIN: string = "anarchychess.xyz";
export const WSS_PATH: string = "/websocket";
const DEV_SERVER_PORT: number = 3031;

// in seconds
export const GAME_START_DELAY: number = 3;

// environment
export enum Environment {
  development,
  production,
}

export enum ValueType {
  wssAddress,
}

export class EnvironmentManager {
  static environment: Environment = Environment.production;
  private static values: Map<Environment, Map<ValueType, any>> = new Map([
    [
      Environment.development,
      new Map([
        [ValueType.wssAddress, `ws://localhost:${DEV_SERVER_PORT}${WSS_PATH}`],
      ]),
    ],
    [
      Environment.production,
      new Map([[ValueType.wssAddress, `wss://${WEBSITE_DOMAIN}${WSS_PATH}`]]),
    ],
  ]);

  static getValue(valueType: ValueType): any {
    return EnvironmentManager.values
      .get(EnvironmentManager.environment)
      ?.get(valueType);
  }
}

// objects
export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
}

export interface Lobby {
  creatorID: string;
  name: string;
  creatorName: string;
  password: string;
  areTeamsPrearranged: boolean;
  capacity: number;
}

// websocket
export enum WSRequestType {
  login,
  register,
  logout,
  getLobbies,
  createLobby,
  joinLobby,
  removeFromLobby,
  changePlayerTeam,
  fillLobbyWithBots,
  removeBotsFromLobby,
  startGame,
  returnToLobby,
  inGame,
}

export interface WSRequest {
  type: WSRequestType;
  params: any;
}

export enum WSResponseStatus {
  // general
  success,
  // login, joinLobby
  failure,
  // register
  usernameTaken,
  emailRegistered,
  // createLobby
  nameTaken,
  // general
  connectionError,
}

export enum WSResponseInfo {
  // register, login
  user,
  // getLobbies
  lobbies,
  // createLobby, joinLobby
  newLobby,
  playerListJSON,
  // inGame
  gameEvent,
}

export interface WSResponse {
  type: WSRequestType;
  status: WSResponseStatus;
  info: Map<WSResponseInfo, any>;
}

// register
export interface RegisterParams {
  username: string;
  email: string;
  password: string;
}

// login
export interface LoginParams {
  usernameOrEmail: string;
  password: string;
}

// createLobby
export interface LobbyCreationParams {
  name: string;
  password: string;
  areTeamsPrearranged: boolean;
}

// joinLobby
export interface LobbyJoiningParams {
  lobbyCreatorID: string;
}

// removeFromLobby
export interface LobbyRemovalParams {
  removedPlayerID: string;
}

// changePlayerTeam
export interface ChangeTeamParams {
  playerID: string;
}

// inGame
export interface MoveRequestParams {
  move: Move;
}

// game event
export enum GameEventType {
  disconnectedFromLobby,
  playerListUpdate,
  gameStarted,
  gameEnded,
  returnToLobby,
  move,
  respawn,
}

export enum GameEventInfo {
  // playerListUpdate
  playerListJSON,
  // gameStarted
  initialCooldown,
  playerIndex,
  // gameEnded
  winningColor,
  // move
  movingPlayerIndex,
  move,
  cooldown,
  respawnTimer,
  enPassantRespawnTimer,
  // respawn
  respawnSquare,
}

export interface GameEvent {
  type: GameEventType;
  info: Map<GameEventInfo, any>;
}

// game status
export enum GameStatus {
  waitingForPlayers,
  running,
  betweenRounds,
}

export function replacer(key: any, value: any) {
  if (
    [
      "isPromotion",
      "isCapture",
      "isEnPassant",
      "isCastle",
      "castleSide",
    ].indexOf(key) > -1
  ) {
    return undefined;
  }
  if (value instanceof Map) {
    return {
      dataType: "Map",
      value: Array.from(value.entries()),
    };
  } else {
    return value;
  }
}

export function reviver(key: any, value: any) {
  if (typeof value === "object" && value !== null) {
    if (value.dataType === "Map") {
      return new Map(value.value);
    }
  }
  return value;
}

export function shuffle(array: any[]) {
  let n = array.length;
  for (let i = 0; i < n; i++) {
    let j: number = Math.floor(Math.random() * (n - i)) + i;
    let temp: any = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
