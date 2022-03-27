export enum EventType {
  gameStarted,
  move,
  death,
}

export interface Event {
  playerIndex: number;
  type: EventType;
  info: Object;
}
