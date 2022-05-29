import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";
import { User } from "../database/database_util";

export class BaseBot implements ClientFlowEngineObserver {
  private clientFlowEngine: ClientFlowEngine = null as any;

  constructor(user: User) {
    this.clientFlowEngine = new ClientFlowEngine(user);
    this.clientFlowEngine.addObserver(this);
  }

  async attemptToConnect(gameID: string, serverIndex: number) {
    this.clientFlowEngine.attemptToConnect(gameID, serverIndex);
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    throw new Error("Method not implemented.");
  }
}
