export enum EventType {
  gameStarted,
  move,
}

export enum EventInfo {
  move,
  moveTimer,
  respawnTimer,
  enPassantRespawnTimer,
}

export interface Event {
  playerIndex: number;
  type: EventType;
  info: Map<EventInfo, any>;
}
