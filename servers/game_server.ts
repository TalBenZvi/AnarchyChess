import Peer from "peerjs";

import {
  NUM_OF_PLAYERS,
  PieceColor,
} from "../src/game_flow_util/game_elements.js";
import {
  Event,
  EventInfo,
  EventType,
  replacer,
  reviver,
  Request,
  PEERJS_SERVER_IP,
  PEERJS_SERVER_PORT,
  PEERJS_SERVER_PATH,
  Lobby,
} from "../src/communication/communication_util.js";
import { GameMechanicsEngine } from "./game_mechanics_engine.js";

const CREATOR_CLIENT_INDEX: number = 0;

export class GameServer {
  private clients: any[] = [...Array(NUM_OF_PLAYERS).fill(null)];
  private engine: GameMechanicsEngine = new GameMechanicsEngine();

  constructor(creatorClient: any, private lobby: Lobby) {
    this.clients[CREATOR_CLIENT_INDEX] = creatorClient;
  }

  // returns whether or not the client was added successfully
  addClient(client: any): boolean {
    for (let i = 0; i < NUM_OF_PLAYERS; i++) {
      if (this.clients[i] != null) {
        this.clients[i] = client;
        this.lobby.capacity++;
        return true;
      }
    }
    return false;
  }

  startGame(
    roleAssignemnts: number[],
    initialPlayerCooldowns: number[]
  ): void {}

  endGame(winningColor: PieceColor) {}

  private sendEvent(event: Event, playerIndex: number) {}

  broadcastEvent(event: Event): void {}
}
