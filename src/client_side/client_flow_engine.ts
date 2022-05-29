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
  ChessBoardComponent,
  GraveYardComponent,
  DeathScreenComponent,
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
  move,
  cooldown,
  // death
  dyingPlayerIndex,
  deathTimer,
  // respawn
  respawningPlayerIndex,
  respawnSquare,
  // move, death, respawn
  respawnPreviewSquare,
  respawnPreviewPiece,
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
  private _board: ChessBoardComponent = null as any;
  private _graveYard: GraveYardComponent = null as any;
  private _deathScreen: DeathScreenComponent = null as any;
  private _promotionScreen: PromotionScreenComponent = null as any;
  private _playerList: PlayerListComponent = null as any;

  private observers: ClientFlowEngineObserver[] = [];

  private selectedMove: Square = null as any;

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

  set board(board: ChessBoardComponent) {
    this._board = board;
  }

  set graveYard(graveYard: GraveYardComponent) {
    this._graveYard = graveYard;
  }

  set deathScreen(deathScreen: DeathScreenComponent) {
    this._deathScreen = deathScreen;
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
      this.selectedMove =
        move == null ? (null as any) : new Square(move.row, move.column);
      if (this._board != null) {
        this._board.setSelectedMove(this.selectedMove);
      }
    }
  }

  private killPlayer(dyingPlayerIndex: number, deathTimer: number): void {
    if (this._graveYard != null) {
      this._graveYard.addPiece(
        Position.getStartPieceByPlayer(dyingPlayerIndex),
        new Date().getTime() + deathTimer * 1000
      );
    }

    if (this._board != null) {
      this._board.killPlayer(dyingPlayerIndex);
      if (dyingPlayerIndex == this.playerIndex) {
        this._board.setPlayerSquare(null as any);
        this._board.startCooldownTimer(null as any, null as any);
        this._board.setRespawnPreview(
          this.position.getRespawnSquareForPlayer(this.playerIndex),
          Position.getStartPieceByPlayer(this.playerIndex)
        );
      }
    }

    this.position.killPlayer(dyingPlayerIndex);

    if (this._deathScreen != null && dyingPlayerIndex === this.playerIndex) {
      this._deathScreen.show(deathTimer);
    }

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
        [
          ClientEventInfo.respawnPreviewSquare,
          dyingPlayerIndex == this.playerIndex
            ? this.position.getRespawnSquareForPlayer(this.playerIndex)
            : (null as any),
        ],
        [
          ClientEventInfo.respawnPreviewPiece,
          dyingPlayerIndex == this.playerIndex
            ? Position.getStartPieceByPlayer(this.playerIndex)
            : (null as any),
        ],
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

    if (this._board != null) {
      this._board.setPovColor(povColor);
      this._board.setPlayerSquare(this.position.getPlayerLocation(playerIndex));
      this._board.setPieces(this.position.playingPieces);
      this._board.setAvailableMoves(
        this.position.findAvaillableMovesForPlayer(this.playerIndex)
      );
      this._board.startCooldownTimer(
        initialCooldown,
        this.position.getPieceByPlayer(playerIndex).color
      );
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

    if (this._board != null) {
      this._board.respawnPlayer(
        respawningPlayerIndex,
        respawnSquare.row,
        respawnSquare.column,
        Position.getStartPieceByPlayer(respawningPlayerIndex)
      );
      this._board.setAvailableMoves(
        this.position.findAvaillableMovesForPlayer(this.playerIndex)
      );
      if (this.position.getPlayerLocation(this.playerIndex) == null) {
        this._board.setRespawnPreview(
          this.position.getRespawnSquareForPlayer(this.playerIndex),
          Position.getStartPieceByPlayer(this.playerIndex)
        );
      } else {
        this._board.setRespawnPreview(null as any, null as any);
      }
      if (respawningPlayerIndex === this.playerIndex) {
        this._board.setPlayerSquare(respawnSquare);
      }
    }

    if (
      this._deathScreen != null &&
      respawningPlayerIndex === this.playerIndex
    ) {
      this._deathScreen.hide();
    }

    let isThisPlayerAlive: boolean =
      this.position.getPlayerLocation(this.playerIndex) != null;
    this.notifyObservers(
      ClientEventType.respawn,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.respawningPlayerIndex, respawningPlayerIndex],
        [ClientEventInfo.respawnSquare, respawnSquare],
        [
          ClientEventInfo.respawnPreviewSquare,
          isThisPlayerAlive
            ? (null as any)
            : this.position.getRespawnSquareForPlayer(this.playerIndex),
        ],
        [
          ClientEventInfo.respawnPreviewPiece,
          isThisPlayerAlive
            ? (null as any)
            : Position.getStartPieceByPlayer(this.playerIndex),
        ],
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
          if (!this.position.move(movingPlayerIndex, move.row, move.column)) {
            this.shouldStopSimulation = true;
          }
          if (movingPlayerIndex === this.playerIndex) {
            this.selectedMove = null as any;
            if (this._board != null) {
              this._board.setSelectedMove(null as any);
              this._board.setPlayerSquare(new Square(move.row, move.column));
              // cooldown
              let cooldownTimer: number = parseFloat(
                event.info.get(EventInfo.cooldown) as string
              );
              this._board.startCooldownTimer(
                new Date().getTime() + cooldownTimer * 1000,
                this.position.getPieceByPlayer(this.playerIndex).color
              );
            }
          }
          if (this._board != null) {
            this._board.movePlayer(movingPlayerIndex, move.row, move.column);
          }
          // isPromotion
          if (move.isPromotion) {
            let promotionType: PieceType = moveNotification.promotionType;
            if (promotionType != null) {
              this.position.promotePieceAt(
                move.row,
                move.column,
                moveNotification.promotionType
              );
              if (this._board != null) {
                await new Promise((f) => setTimeout(f, 140));
                this._board.promotePlayer(
                  movingPlayerIndex,
                  Piece.generate(
                    moveNotification.promotionType,
                    this.position.getPieceByPlayer(movingPlayerIndex).color
                  )
                );
              }
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
            if (this._board != null) {
              this._board.movePlayer(movingRookIndex, startRow, destColumn);
            }
          }
          // update board
          if (this._board != null) {
            let availableMoves: Move[] =
              this.position.findAvaillableMovesForPlayer(this.playerIndex);
            this._board.setAvailableMoves(availableMoves);
            if (this.selectedMove != null) {
              let isSelectedMoveAvailable = false;
              for (let availableMove of availableMoves) {
                if (
                  availableMove.row === this.selectedMove.row &&
                  availableMove.column === this.selectedMove.column
                ) {
                  isSelectedMoveAvailable = true;
                }
              }
              if (!isSelectedMoveAvailable) {
                this.selectedMove = null as any;
                this._board.setSelectedMove(null as any);
              }
            }
            if (this.position.getPlayerLocation(this.playerIndex) == null) {
              this._board.setRespawnPreview(
                this.position.getRespawnSquareForPlayer(this.playerIndex),
                Position.getStartPieceByPlayer(this.playerIndex)
              );
            }
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
