import { NUM_OF_PLAYERS, Move } from "../game_flow_util/game_elements";
import { Event, EventInfo, EventType, GameStatus, replacer } from "../game_flow_util/communication";
import Gun from "gun";

const GUN_SERVER_PORT = 3030;

export enum ServerNotificationType {
  filledServer,
  receivedMove,
}

export enum ServerNotificationInfo {
  playerIndex,
  move,
}

export interface ServerObserver {
  notify(
    notification: ServerNotificationType,
    notificationInfo: Map<ServerNotificationInfo, any>
  ): void;
}

export class GameServer {
  private gun: any = null;
  private eventlog: Event[] = [];
  private gameID: string = null as any;
  private playerIDs: string[] = [];
  private gameStatus: GameStatus = GameStatus.inactive;

  constructor(private observer: ServerObserver) {}

  acceptConnections(gameID: string): void {
    if (this.gameStatus === GameStatus.inactive) {
      this.gameStatus = GameStatus.waitingForPlayers;
      this.gameID = gameID;
      this.gun = Gun({
        peers: [`http://localhost:${GUN_SERVER_PORT}/gun`],
      });
      this.gun
        .get(`${this.gameID}_connectionRequest`)
        .map()
        .once((request: any) => {
          let playerID: string = request.data;
          //console.log(`request: ${playerID}`);
          if (
            this.playerIDs.indexOf(playerID) === -1 &&
            this.playerIDs.length < NUM_OF_PLAYERS
          ) {
            this.playerIDs.push(playerID);
            this.gun
              .get(`${this.gameID}_conenctedPlayers`)
              .set({ data: JSON.stringify(this.playerIDs) });
            //console.log(`conenctedPlayers: ${this.playerIDs.toString()}`);
            if (this.playerIDs.length >= NUM_OF_PLAYERS) {
              //console.log(this.playerIDs);
              this.observer.notify(
                ServerNotificationType.filledServer,
                new Map<ServerNotificationInfo, any>()
              );
            }
          }
        });
    }
  }

  startGame(): void {
    if (this.gameStatus === GameStatus.waitingForPlayers) {
      this.gameStatus = GameStatus.running;
      console.log("game started");
      if (this.playerIDs.length >= NUM_OF_PLAYERS) {
        this.playerIDs = this.playerIDs.slice(0, NUM_OF_PLAYERS);
        for (let i = 0; i < NUM_OF_PLAYERS; i++) {
          this.gun
            .get(`${this.gameID}_moveRequest_${i}`)
            .map()
            .once((request: any) => {
              let moveRequest: Move = JSON.parse(request.data);
              this.observer.notify(
                ServerNotificationType.receivedMove,
                new Map<ServerNotificationInfo, any>([
                  [ServerNotificationInfo.playerIndex, i],
                  [ServerNotificationInfo.move, moveRequest],
                ])
              );
            });
        }
        let playerIndices: Map<string, number> = new Map<string, number>();
        for (let i = 0; i < NUM_OF_PLAYERS; i++) {
          playerIndices.set(this.playerIDs[i], i);
        }

        // temp
        let otherPlayerID = this.playerIDs[9];
        playerIndices.set(otherPlayerID, playerIndices.get("id0") as number);
        playerIndices.set("id0", 9);

        this.broadcastEvents([
          {
            type: EventType.gameStarted,
            info: new Map<EventInfo, string>([
              [EventInfo.connectedPlayerIndices, JSON.stringify(playerIndices, replacer)],
            ]),
          },
        ]);
      }
    }
  }

  broadcastEvents(events: Event[]): void {
    this.eventlog = this.eventlog.concat(events);
    this.gun
      .get(`${this.gameID}_events`)
      .set({ data: JSON.stringify(this.eventlog, replacer) });
  }
}
