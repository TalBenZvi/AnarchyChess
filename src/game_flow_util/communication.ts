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
  connectedPlayerIndices,
  initialPlayerCooldowns,
  // move
  playerIndex,
  move,
  cooldown,
  respawnTimer,
  enPassantRespawnTimer,
  // respawn
  respawnSquare
}

export interface Event {
  type: EventType;
  info: Map<EventInfo, string>;
}

export enum GameStatus {
  inactive,
  waitingForPlayers,
  running,
}

export function replacer(key: any, value: any) {
  if (["isPromotion", "isCapture", "isEnPassant", "isCastle", "castleSide"].indexOf(key) > -1) {
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