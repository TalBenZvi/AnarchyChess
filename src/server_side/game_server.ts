import { NUM_OF_PLAYERS, Move } from "../game_flow_util/game_elements";
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  replacer,
  reviver,
  Request,
  RequestType,
  RequestInfo,
} from "../game_flow_util/communication";
import Gun from "gun";

const GUN_SERVER_PORT = 3030;

export enum ServerNotificationType {
  filledServer,
  receivedRequest,
}

export enum ServerNotificationInfo {
  playerIndex,
  request,
}

export interface ServerObserver {
  notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ): void;
}

export class GameServer {
  private gun: any = null;
  private gameID: string = null as any;
  private playerIDs: string[] = [];
  private gameStatus: GameStatus = GameStatus.inactive;
  private eventLog: Event[] = [];
  private recentlyResentEventIndices: number[] = [];

  constructor(private observer: ServerObserver) {}

  // debug
  private fillWithDummies(numOfDummies: number) {
    this.playerIDs = [...Array(numOfDummies)].map(
      (_, i) => `id${i + NUM_OF_PLAYERS - numOfDummies}`
    );
  }

  // debug
  private assignCustomIndices(customIndices: number[]): Map<string, number> {
    let leftoverIndices: number[] = Array.from(
      Array(NUM_OF_PLAYERS).keys()
    ).filter((i) => customIndices.indexOf(i) <= -1);
    let playerIndices: Map<string, number> = new Map<string, number>();
    for (let i = 0; i < customIndices.length; i++) {
      playerIndices.set(`id${i}`, customIndices[i]);
    }
    for (let i = 0; i < leftoverIndices.length; i++) {
      playerIndices.set(`id${i + customIndices.length}`, leftoverIndices[i]);
    }
    return playerIndices;
  }

  acceptConnections(gameID: string): void {
    //this.fillWithDummies(NUM_OF_PLAYERS - 16);
    if (this.gameStatus === GameStatus.inactive) {
      this.eventLog = [];
      this.gameStatus = GameStatus.waitingForPlayers;
      this.gameID = gameID;
      this.gun = Gun({
        peers: [`http://localhost:${GUN_SERVER_PORT}/gun`],
      });
      this.gun
        .get(`${this.gameID}_connectionRequest`)
        .map()
        .once((request: any) => {
          if (request !== undefined) {
            let playerID: string = request.data;
            if (
              this.playerIDs.indexOf(playerID) === -1 &&
              this.playerIDs.length < NUM_OF_PLAYERS
            ) {
              this.playerIDs.push(playerID);
              this.gun
                .get(`${this.gameID}_conenctedPlayers`)
                .set({ data: JSON.stringify(this.playerIDs) });
              if (this.playerIDs.length >= NUM_OF_PLAYERS) {
                this.observer.notify(
                  ServerNotificationType.filledServer,
                  new Map<ServerNotificationInfo, any>()
                );
              }
            }
          }
        });
    }
  }

  private rebroadcastEvents(eventIndices: number[]): void {
    for (let eventIndex of eventIndices) {
      console.log(`resending event ${eventIndex}`);
      this.gun
        .get(`${this.gameID}_events`)
        .set({ data: JSON.stringify(this.eventLog[eventIndex], replacer) });
    }
  }

  startGame(initialPlayerCooldowns: number[]): void {
    if (this.gameStatus === GameStatus.waitingForPlayers) {
      this.gameStatus = GameStatus.running;
      console.log("game started");
      if (this.playerIDs.length >= NUM_OF_PLAYERS) {
        this.playerIDs = this.playerIDs.slice(0, NUM_OF_PLAYERS);
        for (let i = 0; i < NUM_OF_PLAYERS; i++) {
          this.gun
            .get(`${this.gameID}_requests_${i}`)
            .map()
            .once((requestData: any) => {
              if (requestData !== undefined) {
                let request: Request = JSON.parse(requestData.data, reviver);
                if (request.type === RequestType.resendEvents) {
                  let missingEventIndices: number[] = JSON.parse(
                    request.info.get(RequestInfo.missingEventIndices) as string,
                    reviver
                  );
                  console.log(`client ${i} requested ${missingEventIndices}`);
                  let eventIndicesToResend: number[] = [];
                  for (let missingEventIndex of missingEventIndices) {
                    if (
                      this.recentlyResentEventIndices.indexOf(
                        missingEventIndex
                      ) === -1
                    ) {
                      this.recentlyResentEventIndices.push(missingEventIndex);
                      eventIndicesToResend.push(missingEventIndex);
                      setTimeout(() => {
                        let locationInRecentlyResentList: number = this.recentlyResentEventIndices.indexOf(
                          missingEventIndex
                        );
                        if (locationInRecentlyResentList > -1) {
                          this.recentlyResentEventIndices.splice(
                            locationInRecentlyResentList
                          );
                        }
                      }, 100);
                    }
                  }
                  this.rebroadcastEvents(eventIndicesToResend);
                } else {
                  this.observer.notify(
                    ServerNotificationType.receivedRequest,
                    new Map<ServerNotificationInfo, any>([
                      [ServerNotificationInfo.playerIndex, i],
                      [ServerNotificationInfo.request, request],
                    ])
                  );
                }
              }
            });
        }
        /*
        let playerIndices: Map<string, number> = this.assignCustomIndices([
          1, 17,
        ]);
        */

        let playerIndices: Map<string, number> = new Map();
        for (let i = 0; i < NUM_OF_PLAYERS; i++) {
          playerIndices.set(this.playerIDs[i], i);
        }

        this.broadcastEvent({
          index: null as any,
          type: EventType.gameStarted,
          info: new Map<EventInfo, string>([
            [
              EventInfo.connectedPlayerIndices,
              JSON.stringify(playerIndices, replacer),
            ],
            [
              EventInfo.initialPlayerCooldowns,
              JSON.stringify(initialPlayerCooldowns),
            ],
          ]),
        });
      }
    }
  }

  broadcastEvent(event: Event): void {
    event.index = this.eventLog.length;
    console.log(`broadcasting event ${event.index}`);
    this.eventLog.push(event);
    this.gun
      .get(`${this.gameID}_events`)
      .set({ data: JSON.stringify(event, replacer) });
  }
}
