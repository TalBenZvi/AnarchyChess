import {
  GameClient,
  ClientNotificationType,
  ClientNotificationInfo,
  GameClientObserver,
} from "./game_client";
import {
  Position,
  Move,
  Square,
  Piece,
  PieceColor,
  CastleSide,
  PieceType,
} from "../game_flow_util/game_elements";
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  reviver,
  OptionalConnectionCallbacks,
} from "../game_flow_util/communication";
import { User } from "../database/database_util";

// in seconds
export const GAME_START_DELAY: number = 3;

export enum ClientEventType {
  disconnection,
  playerListUpdate,
  roleAssigned,
  gameStarted,
  move,
  promotion,
  death,
  respawn,
  moveSent,
}

export enum ClientEventInfo {
  // playerListUpdate
  playerList,
  // roleAssigned
  playerIndex,
  // gameStarted
  initialCooldown,
  // move
  movingPlayerIndex,
  destSquare,
  cooldown,
  // promotion
  promotingPlayerIndex,
  promotionPiece,
  // death
  dyingPlayerIndex,
  deathTimer,
  // respawn
  respawningPlayerIndex,
  respawnSquare,
  // moveSent
  sentMove,
}

export interface ClientFlowEngineObserver {
  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void;
}

export class ClientFlowEngine implements GameClientObserver {
  private gameClient: GameClient;

  private user: User;

  private position: Position = null as any;
  private _playerIndex: number = null as any;
  isGameRunning: boolean = false;

  private observers: ClientFlowEngineObserver[] = [];

  // debug
  public shouldStopSimulation: boolean = false;
  private receivedEventIndices: number[] = [];

  constructor(user: User) {
    this.user = user;
    this.gameClient = new GameClient(this, user);
  }

  get playerIndex(): number {
    return this._playerIndex;
  }

  addObserver(observer: ClientFlowEngineObserver) {
    this.observers.push(observer);
  }

  private notifyObservers(
    eventType: ClientEventType,
    info: Map<ClientEventInfo, any>
  ) {
    for (let observer of this.observers) {
      observer.notify(eventType, info);
    }
  }

  // returns whether or not the connection was successfull
  attemptToConnect(
    gameID: string,
    serverIndex: number,
    optionalConnectionCallbacks: OptionalConnectionCallbacks
  ) {
    this.gameClient.attemptToConnect(gameID, serverIndex, {
      onSuccess: () => {
        if (optionalConnectionCallbacks.onSuccess != undefined) {
          optionalConnectionCallbacks.onSuccess();
        }
      },
      onFailure: () => {
        if (optionalConnectionCallbacks.onFailure != undefined) {
          optionalConnectionCallbacks.onFailure();
        }
      },
    });
  }

  destroyConnection(): void {
    if (this.gameClient != null) {
      this.gameClient.destroyConenction();
    }
  }

  getPosition(): Position {
    return this.position;
  }

  sendMove(move: Move): void {
    if (!(move != null && move.isPromotion && move.promotionType == null)) {
      this.gameClient.sendMove(move);
    }
    this.notifyObservers(
      ClientEventType.moveSent,
      new Map<ClientEventInfo, any>([[ClientEventInfo.sentMove, move]])
    );
  }

  private killPlayer(dyingPlayerIndex: number, deathTimer: number): void {
    this.position.killPlayer(dyingPlayerIndex);
    this.notifyObservers(
      ClientEventType.death,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.dyingPlayerIndex, dyingPlayerIndex],
        [ClientEventInfo.deathTimer, deathTimer],
      ])
    );
  }

  private updatePlayerList(connectedPlayers: User[]): void {
    this.notifyObservers(
      ClientEventType.playerListUpdate,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.playerList, [...connectedPlayers]],
      ])
    );
  }

  private startGame(playerIndex: number, initialCooldown: number): void {
    this.isGameRunning = true;
    this._playerIndex = playerIndex;
    this.gameClient.playerIndex = playerIndex;
    this.gameClient.gameStatus = GameStatus.running;
    this.position = new Position(`client ${playerIndex}`);
    this.position.setToStartingPosition();
    this.notifyObservers(
      ClientEventType.roleAssigned,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.playerIndex, playerIndex],
      ])
    );
    setTimeout(() => {
      this.notifyObservers(
        ClientEventType.gameStarted,
        new Map<ClientEventInfo, any>([
          [ClientEventInfo.initialCooldown, initialCooldown],
        ])
      );
    }, GAME_START_DELAY * 1000);
  }

  private respawnPlayer(
    respawningPlayerIndex: number,
    respawnSquare: Square
  ): void {
    this.position.respawnPlayerAt(
      respawningPlayerIndex,
      new Square(respawnSquare.row, respawnSquare.column)
    );

    this.notifyObservers(
      ClientEventType.respawn,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.respawningPlayerIndex, respawningPlayerIndex],
        [ClientEventInfo.respawnSquare, respawnSquare],
      ])
    );
  }

  private async registerEvent(event: Event) {
    this.receivedEventIndices.push(event.index);
    switch (event.type) {
      // player list update
      case EventType.playerListUpdate: {
        let connectedPlayers: User[] = JSON.parse(
          event.info.get(EventInfo.connectedPlayers) as string,
          reviver
        );
        this.updatePlayerList(connectedPlayers);
        break;
      }
      // game started
      case EventType.gameStarted: {
        let playerIndex: number = JSON.parse(
          event.info.get(EventInfo.playerIndex) as string,
          reviver
        );
        let initialCooldown: number = JSON.parse(
          event.info.get(EventInfo.initialCooldown) as string
        );
        this.startGame(playerIndex, initialCooldown);
        break;
      }
      // move
      case EventType.move: {
        let moveNotification: Move = JSON.parse(
          event.info.get(EventInfo.move) as string
        );
        let movingPlayerIndex: number = parseInt(
          event.info.get(EventInfo.playerIndex) as string
        );
        let move: Move = this.position.locateMoveForPlayer(
          parseInt(event.info.get(EventInfo.playerIndex) as string),
          moveNotification
        );
        let movingPlayerLocation: Square =
          this.position.getPlayerLocation(movingPlayerIndex);
        // if move is valid
        if (move != null) {
          // isCapture
          if (move.isCapture) {
            let dyingPlayerIndex = this.position.playerAt(
              move.row,
              move.column
            );
            let respawnTimer: number = parseInt(
              event.info.get(EventInfo.respawnTimer) as string
            );
            this.killPlayer(dyingPlayerIndex, respawnTimer);
          }
          // isEnpassant
          if (move.isEnPassant) {
            let enPassantedPlayerIndex = this.position.playerAt(
              movingPlayerLocation.row,
              move.column
            );
            let respawnTimer: number = parseInt(
              event.info.get(EventInfo.enPassantRespawnTimer) as string
            );
            this.killPlayer(enPassantedPlayerIndex, respawnTimer);
          }
          // execute move
          this.position.move(movingPlayerIndex, move.row, move.column);
          let cooldownTimer: number = parseFloat(
            event.info.get(EventInfo.cooldown) as string
          );
          this.notifyObservers(
            ClientEventType.move,
            new Map<ClientEventInfo, any>([
              [ClientEventInfo.movingPlayerIndex, movingPlayerIndex],
              [ClientEventInfo.destSquare, new Square(move.row, move.column)],
              [ClientEventInfo.cooldown, cooldownTimer],
            ])
          );
          // isPromotion
          if (move.isPromotion) {
            let promotionType: PieceType = moveNotification.promotionType;
            if (promotionType != null) {
              this.position.promotePieceAt(
                move.row,
                move.column,
                moveNotification.promotionType
              );

              this.notifyObservers(
                ClientEventType.promotion,
                new Map<ClientEventInfo, any>([
                  [ClientEventInfo.promotingPlayerIndex, movingPlayerIndex],
                  [
                    ClientEventInfo.promotionPiece,
                    Piece.generate(
                      moveNotification.promotionType,
                      this.position.getPieceByPlayer(movingPlayerIndex).color
                    ),
                  ],
                ])
              );
            }
          }
          // isCastle
          if (move.isCastle) {
            let movingPiece: Piece =
              this.position.getPieceByPlayer(movingPlayerIndex);
            let startRow: number =
              movingPiece.color === PieceColor.white ? 0 : 7;
            let startColumn: number =
              move.castleSide === CastleSide.kingSide ? 7 : 0;
            let destColumn: number =
              move.castleSide === CastleSide.kingSide ? 5 : 3;
            let movingRookIndex = this.position.playerAt(startRow, startColumn);
            this.position.move(movingRookIndex, startRow, destColumn);
            this.notifyObservers(
              ClientEventType.move,
              new Map<ClientEventInfo, any>([
                [ClientEventInfo.movingPlayerIndex, movingRookIndex],
                [ClientEventInfo.destSquare, new Square(move.row, move.column)],
                [ClientEventInfo.cooldown, 0],
              ])
            );
          }
        }
        break;
      }
      // respawn
      case EventType.respawn: {
        let respawningPlayerIndex: number = parseInt(
          event.info.get(EventInfo.playerIndex) as string
        );
        let respawnSquare: Square = JSON.parse(
          event.info.get(EventInfo.respawnSquare) as string
        );
        this.respawnPlayer(respawningPlayerIndex, respawnSquare);
        break;
      }
    }
  }

  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void {
    switch (notification) {
      case ClientNotificationType.disconnectedFromServer: {
        this.notifyObservers(
          ClientEventType.disconnection,
          new Map<ClientEventInfo, any>()
        );
        break;
      }
      case ClientNotificationType.receivedEvent: {
        this.registerEvent(notificationInfo.get(ClientNotificationInfo.event));
        break;
      }
    }
  }

  async runTest() {
    let promotionTypes: PieceType[] = [
      PieceType.knight,
      PieceType.bishop,
      PieceType.rook,
      PieceType.queen,
    ];
    let availableMoves: Move[] = this.position.findAvaillableMovesForPlayer(
      this._playerIndex
    );
    if (availableMoves.length !== 0) {
      let chosenMove: Move =
        availableMoves[Math.floor(Math.random() * availableMoves.length)];
      if (chosenMove.isPromotion) {
        chosenMove.promotionType =
          promotionTypes[Math.floor(Math.random() * promotionTypes.length)];
      }
      this.sendMove(chosenMove);
    }
  }
}
