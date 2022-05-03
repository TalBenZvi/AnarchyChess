import { Piece, colorToString, typeToString } from "./game_elements";

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
  hardUpadte,
}

export enum EventInfo {
  // playerListUpdate
  connectedPlayers,
  // gameStarted
  connectedPlayerIndices,
  initialPlayerCooldowns,
  // move
  playerIndex,
  move,
  cooldown,
  respawnTimer,
  enPassantRespawnTimer,
  // respawn
  respawnSquare,
  // hardUpdate
  position,
  // debug
  test,
}


export interface Request {
  type: RequestType;
  info: Map<RequestInfo, string>;
}

export enum RequestType {
  move,
  resendEvents,
}

export enum RequestInfo {
  // move
  move,
  // resendEvents
  missingEventIndices,
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
