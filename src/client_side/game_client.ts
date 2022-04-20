import { Move } from "../game_flow_util/game_elements";
import { Event, GameStatus, reviver } from "../game_flow_util/communication";
import Gun from "gun";

const GUN_SERVER_PORT = 3030;

const MAX_CONNECTION_TRIES: number = 10;

export enum ClientNotificationType {
  disconnectedFromServer,
  receivedEvent,
}

export enum ClientNotificationInfo {
  event,
}

export interface ClientObserver {
  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void;
}

export enum ConnectionStatus {
  success,
  failure,
}

export class GameClient {
  private gun: any = null;
  private gameID: string = null as any;
  gameStatus: GameStatus = GameStatus.inactive;
  playerIndex: number = null as any;

  constructor(private observer: ClientObserver, private playerID: string) {}

  async attemptToConnect(
    ip: string,
    gameID: string
  ): Promise<ConnectionStatus> {
    if (this.gameStatus === GameStatus.inactive) {
      this.gameID = gameID;
      this.gun = Gun({
        peers: [`http://${ip}:${GUN_SERVER_PORT}/gun`],
        localStorage: false,
      });
      let didConnect: boolean = false;
      this.gun
        .get(`${this.gameID}_connectionRequest`)
        .set({ data: this.playerID });
      this.gun
        .get(`${this.gameID}_conenctedPlayers`)
        .map()
        .once((request: any) => {
          let connectedIDs: string[] = JSON.parse(request.data);
          if (connectedIDs.indexOf(this.playerID) > -1) {
            didConnect = true;
          }
        });
      for (let i = 0; i < MAX_CONNECTION_TRIES; i++) {
        await new Promise((f) => setTimeout(f, 1000));
        if (didConnect) {
          this.gun
            .get(`${this.gameID}_events`)
            .map()
            .once((request: any) => {
              let event: Event = JSON.parse(request.data, reviver);
              this.observer.notify(
                ClientNotificationType.receivedEvent,
                new Map<ClientNotificationInfo, any>([
                  [ClientNotificationInfo.event, event],
                ])
              );
            });
          this.gameStatus = GameStatus.waitingForPlayers;
          return ConnectionStatus.success;
        }
      }
    }

    return ConnectionStatus.failure;
  }

  sendMove(move: Move): void {
    if (this.gameStatus === GameStatus.running && this.playerIndex != null) {
      this.gun
        .get(`${this.gameID}_moveRequest_${this.playerIndex}`)
        .set({ data: JSON.stringify(move) });
    }
  }
}
