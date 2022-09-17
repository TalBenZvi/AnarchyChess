export const PEERJS_SERVER_IP: string = "34.204.67.216";
// export const PEERJS_SERVER_IP: string = "127.0.0.1";
export const PEERJS_SERVER_PORT: number = 3030;
export const PEERJS_SERVER_PATH: string = "/anarchy_chess";

export const WEBSITE_DOMAIN: string = "anarchychess.xyz";
export const WSS_PATH: string = "/websocket";

const DEV_SERVER_PORT: number = 3031;

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

export interface User {
  id: string;
  username: string;
  email?: string;
  password?: string;
}

export enum WSRequestType {
  login,
}

export interface WSRequest {
  type: WSRequestType;
  params: any;
}

export enum WSResponseInfo {
  // login
  user,
}

export interface WSResponse {
  type: WSRequestType;
  status: any;
  info: Map<WSResponseInfo, any>;
}

export enum LoginStatus {
  success,
  failure,
  connectionError,
}




export interface Event {
  index: number;
  type: EventType;
  info: Map<EventInfo, string>;
}

export enum EventType {
  playerListUpdate,
  gameStarted,
  gameEnded,
  returnToLobby,
  move,
  respawn,
}

export enum EventInfo {
  // playerListUpdate
  playerList,
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

export enum RequestType {
  connection,
  disconnection,
  move,
}

export enum RequestInfo {
  // connection
  user,
  // move
  move,
}

export interface Request {
  type: RequestType;
  info: Map<RequestInfo, string>;
}

export enum GameStatus {
  inactive,
  waitingForPlayers,
  running,
  betweenRounds,
}

export interface OptionalConnectionCallbacks {
  onSuccess?: () => void;
  onFailure?: () => void;
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
