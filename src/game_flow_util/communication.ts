export const PEERJS_SERVER_IP: string = "127.0.0.1";
export const PEERJS_SERVER_PORT: number = 3030;

export interface Event {
  index: number
  type: EventType;
  info: Map<EventInfo, string>;
}

export enum EventType {
  playerListUpdate,
  gameStarted,
  move,
  respawn,
}

export enum EventInfo {
  // playerListUpdate
  connectedPlayers,
  // gameStarted
  playerIndex,
  initialCooldown,
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
  /*
  } else if (value instanceof Piece) {
    return `{${colorToString.get(value.color)} ${typeToString.get(value.type)}}`;
    */
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
