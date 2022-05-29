import {
  GameClient,
  ClientNotificationType,
  ClientNotificationInfo,
  GameClientObserver,
  ConnectionStatus,
} from "./game_client";
import {
  Position,
  Move,
  Square,
  Piece,
  PieceColor,
  CastleSide,
  PieceType,
  PlayingPiece,
} from "../game_flow_util/game_elements";
import {
  GraveYardComponent,
  PromotionScreenComponent,
  PlayerListComponent,
  ClientPageComponent,
} from "../components/game_component_interfaces";
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  reviver,
} from "../game_flow_util/communication";
import { User } from "../database/database_util";

export enum ClientEventType {
  disconnection,
  playerListUpdate,
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
  // gameStarted
  playerIndex,
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
  public targetServerIndex: number = null as any;
  private gameClient: GameClient;

  private playerIndex: number = null as any;
  private playerID: string;

  private position: Position = null as any;

  private _clientPage: ClientPageComponent = null as any;
  private _graveYard: GraveYardComponent = null as any;
  private _promotionScreen: PromotionScreenComponent = null as any;
  private _playerList: PlayerListComponent = null as any;

  private observers: ClientFlowEngineObserver[] = [];

  // debug
  public shouldStopSimulation: boolean = false;
  private receivedEventIndices: number[] = [];

  constructor(playerID: string) {
    this.playerID = playerID;
    this.gameClient = new GameClient(this, playerID);
  }

  set clientPage(clientPage: ClientPageComponent) {
    this._clientPage = clientPage;
  }

  set graveYard(graveYard: GraveYardComponent) {
    this._graveYard = graveYard;
  }

  set promotionScreen(promotionScreen: PromotionScreenComponent) {
    this._promotionScreen = promotionScreen;
  }

  set playerList(playerList: PlayerListComponent) {
    this._playerList = playerList;
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

  async attemptToConnect(gameID: string) {
    if (this.targetServerIndex != null) {
      let connectionStatus: ConnectionStatus =
        await this.gameClient.attemptToConnect(gameID, this.targetServerIndex);
      console.log(`${this.playerID}: ${connectionStatus}`);
    }
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
    if (move != null && move.isPromotion && move.promotionType == null) {
      if (this._promotionScreen != null) {
        this._promotionScreen.show(
          move,
          this.position.getPieceByPlayer(this.playerIndex).color
        );
      }
    } else {
      this.gameClient.sendMove(move);
    }

    this.notifyObservers(
      ClientEventType.moveSent,
      new Map<ClientEventInfo, any>([[ClientEventInfo.sentMove, move]])
    );
  }

  private killPlayer(dyingPlayerIndex: number, deathTimer: number): void {
    if (this._graveYard != null) {
      this._graveYard.addPiece(
        Position.getStartPieceByPlayer(dyingPlayerIndex),
        new Date().getTime() + deathTimer * 1000
      );
    }

    this.position.killPlayer(dyingPlayerIndex);

    if (
      this._promotionScreen != null &&
      dyingPlayerIndex === this.playerIndex
    ) {
      this._promotionScreen.hide();
    }

    this.notifyObservers(
      ClientEventType.death,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.dyingPlayerIndex, dyingPlayerIndex],
        [ClientEventInfo.deathTimer, deathTimer],
      ])
    );
  }

  private updatePlayerList(connectedPlayers: User[]): void {
    if (this._playerList != null) {
      this._playerList.setPlayers([...connectedPlayers]);
    }

    this.notifyObservers(
      ClientEventType.playerListUpdate,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.playerList, [...connectedPlayers]],
      ])
    );
  }

  private startGame(playerIndex: number, initialCooldown: number): void {
    this.playerIndex = playerIndex;
    this.gameClient.playerIndex = playerIndex;
    this.gameClient.gameStatus = GameStatus.running;
    this.position = new Position(`client ${playerIndex}`);
    this.position.setToStartingPosition();
    let povColor: PieceColor = this.position.getPieceByPlayer(
      this.playerIndex
    ).color;

    if (this._graveYard != null) {
      this._graveYard.clear();
      this._graveYard.setPovColor(povColor);
    }

    this.notifyObservers(
      ClientEventType.gameStarted,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.playerIndex, playerIndex],
        [ClientEventInfo.initialCooldown, initialCooldown],
      ])
    );
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
        if (this._clientPage != null) {
          this._clientPage.disconnect();
        }
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
      this.playerIndex
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
