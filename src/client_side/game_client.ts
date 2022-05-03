import { Move } from "../game_flow_util/game_elements";
import {
  Event,
  GameStatus,
  reviver,
  EventInfo,
  Request,
  replacer,
  RequestType,
  RequestInfo,
  EventType,
} from "../game_flow_util/communication";
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
  private lastEventIndex: number = null as any;
  private isSyncedWithServer: boolean = true;
  private outOfOrderEvents: Event[] = [];
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
        .once((update: any) => {
          if (update !== undefined) {
            let connectedIDs: string[] = JSON.parse(update.data);
            if (connectedIDs.indexOf(this.playerID) > -1) {
              didConnect = true;
            }
          }
        });
      for (let i = 0; i < MAX_CONNECTION_TRIES; i++) {
        await new Promise((f) => setTimeout(f, 1000));
        if (didConnect) {
          this.isSyncedWithServer = true;
          this.outOfOrderEvents = [];
          this.gun
            .get(`${this.gameID}_events`)
            .map()
            .once((request: any) => {
              if (request !== undefined) {
                let event: Event = JSON.parse(request.data, reviver);
                if (
                  this.lastEventIndex == null ||
                  event.index === this.lastEventIndex + 1
                ) {
                  // event arrived in order
                  this.lastEventIndex = event.index;
                  //event.info.set(EventInfo.test, "in order");
                  this.observer.notify(
                    ClientNotificationType.receivedEvent,
                    new Map<ClientNotificationInfo, any>([
                      [ClientNotificationInfo.event, event],
                    ])
                  );
                  if (
                    this.outOfOrderEvents.length !== 0 &&
                    event.index + 1 === this.outOfOrderEvents[0].index
                  ) {
                    // event filled gap
                    for (let i = 0; i < this.outOfOrderEvents.length; i++) {
                      if (
                        this.outOfOrderEvents[i].index ===
                        this.lastEventIndex + 1
                      ) {
                        // missing events are continuous
                        this.lastEventIndex++;
                        let correctedOrderEvents: Event[] = this.outOfOrderEvents.splice(
                          i
                        );
                        this.observer.notify(
                          ClientNotificationType.receivedEvent,
                          new Map<ClientNotificationInfo, any>([
                            [
                              ClientNotificationInfo.event,
                              correctedOrderEvents[0],
                            ],
                          ])
                        );
                      } else {
                        // missing events have a gap in them
                        this.sendRequest({
                          type: RequestType.resendEvents,
                          info: new Map<RequestInfo, string>([
                            [
                              RequestInfo.missingEventIndices,
                              JSON.stringify(
                                [
                                  ...Array(
                                    this.outOfOrderEvents[i].index -
                                      this.lastEventIndex -
                                      1
                                  ),
                                ].map((_, i) => i + this.lastEventIndex + 1),
                                replacer
                              ),
                            ],
                          ]),
                        });
                        break;
                      }
                    }
                    if (this.outOfOrderEvents.length === 0) {
                      this.isSyncedWithServer = true;
                    }
                  }
                } else if (event.index > this.lastEventIndex + 1) {
                  // event arrived out of order
                  this.outOfOrderEvents.push(event);
                  if (
                    this.isSyncedWithServer ||
                    (this.outOfOrderEvents.length >= 6 &&
                      this.outOfOrderEvents.length % 3 === 0)
                  ) {
                    this.isSyncedWithServer = false;
                    this.sendRequest({
                      type: RequestType.resendEvents,
                      info: new Map<RequestInfo, string>([
                        [
                          RequestInfo.missingEventIndices,
                          JSON.stringify(
                            [
                              ...Array(
                                this.outOfOrderEvents[0].index -
                                  this.lastEventIndex -
                                  1
                              ),
                            ].map((_, i) => i + this.lastEventIndex + 1),
                            replacer
                          ),
                        ],
                      ]),
                    });
                  }
                }
              }
            });
          this.gameStatus = GameStatus.waitingForPlayers;
          return ConnectionStatus.success;
        } else {
          this.gun
            .get(`${this.gameID}_connectionRequest`)
            .set({ data: this.playerID });
        }
      }
    }

    return ConnectionStatus.failure;
  }

  private sendRequest(request: Request): void {
    if (this.gameStatus === GameStatus.running && this.playerIndex != null) {
      this.gun
        .get(`${this.gameID}_requests_${this.playerIndex}`)
        .set({ data: JSON.stringify(request, replacer) });
    }
  }

  sendMove(move: Move): void {
    this.sendRequest({
      type: RequestType.move,
      info: new Map<RequestInfo, string>([
        [RequestInfo.move, JSON.stringify(move, replacer)],
      ]),
    });
  }
}
