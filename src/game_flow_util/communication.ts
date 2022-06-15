export const PEERJS_SERVER_IP: string = "127.0.0.1";
export const PEERJS_SERVER_PORT: number = 3030;
export const PEERJS_SERVER_PATH: string = "/anarchy_chess";


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
