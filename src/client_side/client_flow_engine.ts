import {
  GameClient,
  ClientNotificationType,
  ClientNotificationInfo,
  ClientObserver,
  ConnectionStatus,
} from "./game_client";
import {
  ChessBoardComponent,
  GraveYardComponent,
  DeathScreenComponent,
  PromotionScreenComponent,
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
  Event,
  EventInfo,
  EventType,
  GameStatus,
  reviver,
} from "../game_flow_util/communication";

export class ClientFlowEngine implements ClientObserver {
  private gameClient: GameClient;
  private position: Position = new Position();
  private _board: ChessBoardComponent = null as any;
  private _graveYard: GraveYardComponent = null as any;
  private _deathScreen: DeathScreenComponent = null as any;
  private _promotionScreen: PromotionScreenComponent = null as any;

  private isGameRunning: boolean = false;
  private playerIndex: number = null as any;
  private playerID: string;

  // in seconds
  //private cooldownTimer: number = null as any;
  // in millis
  //private cooldownCompletionTime: number = null as any;
  // in millis
  private selectedMove: Square = null as any;

  constructor(playerID: string) {
    this.playerID = playerID;
    this.gameClient = new GameClient(this, playerID);
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

  async attemptToConnect(ip: string, gameID: string) {
    let connectionStatus: ConnectionStatus =
      await this.gameClient.attemptToConnect(ip, gameID);
    console.log(`${this.playerID}: ${connectionStatus}`);
  }

  sendMove(move: Move) {
    if (move != null && move.isPromotion && move.promotionType == null) {
      if (this._promotionScreen != null) {
        console.log("here1");
        this._promotionScreen.show(
          move,
          this.position.getPieceByPlayer(this.playerIndex).color
        );
      }
    } else {
      this.gameClient.sendMove(move);
      this.selectedMove =
        move == null ? (null as any) : new Square(move.row, move.column);
      //this.updateBoard(null as any);
      if (this._board != null) {
        this._board.setSelectedMove(this.selectedMove);
      }
    }
  }

  private killPlayer(dyingPlayerIndex: number, respawnTimer: number) {
    if (this._graveYard != null) {
      this._graveYard.addPiece(
        Position.getStartPieceByPlayer(dyingPlayerIndex),
        new Date().getTime() + respawnTimer * 1000
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
      this._deathScreen.show(respawnTimer);
    }
    if (
      this._promotionScreen != null &&
      dyingPlayerIndex === this.playerIndex
    ) {
      this._promotionScreen.hide();
    }
  }

  private async registerEvent(event: Event) {
    switch (event.type) {
      // game started
      case EventType.gameStarted: {
        let playerIndex: number = (
          JSON.parse(
            event.info.get(EventInfo.connectedPlayerIndices) as string,
            reviver
          ) as Map<string, number>
        ).get(this.playerID) as number;
        this.playerIndex = playerIndex;
        this.gameClient.playerIndex = playerIndex;
        this.gameClient.gameStatus = GameStatus.running;
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
          this._board.setPlayerSquare(
            this.position.getPlayerLocation(playerIndex)
          );
          this._board.setPieces(this.position.playingPieces);
          this._board.setAvailableMoves(
            this.position.findAvaillableMovesForPlayer(this.playerIndex)
          );
        }
        break;
      }
      // move
      case EventType.move: {
        //let moveUpdateTime = new Date().getTime();
        let moveNotification: Move = JSON.parse(
          event.info.get(EventInfo.move) as string
        );
        let move: Move = this.position.locateMoveForPlayer(
          parseInt(event.info.get(EventInfo.playerIndex) as string),
          moveNotification
        );
        let movingPlayerIndex: number = parseInt(
          event.info.get(EventInfo.playerIndex) as string
        );
        // cooldown
        /*
        if (movingPlayerIndex === this.playerIndex) {
          this.cooldownTimer = parseInt(
            event.info.get(EventInfo.cooldown) as string
          );
          this.cooldownCompletionTime =
            moveUpdateTime + this.cooldownTimer * 1000;
        }
        */
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
          if (movingPlayerIndex === this.playerIndex) {
            this.selectedMove = null as any;
            if (this._board != null) {
              this._board.setSelectedMove(null as any);
              this._board.setPlayerSquare(new Square(move.row, move.column));
              let cooldownTimer: number = parseInt(
                event.info.get(EventInfo.cooldown) as string
              );
              this._board.startCooldownTimer(
                cooldownTimer,
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
          }
          if (this._board != null) {
            this._board.setAvailableMoves(
              this.position.findAvaillableMovesForPlayer(this.playerIndex)
            );
          }
        }
        break;
      }
      case EventType.respawn: {
        // respawn
        let respawningPlayerIndex: number = parseInt(
          event.info.get(EventInfo.playerIndex) as string
        );
        let respawnSquare: Square = JSON.parse(
          event.info.get(EventInfo.respawnSquare) as string
        );
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
          if (respawningPlayerIndex === this.playerIndex) {
            this._board.setRespawnPreview(null as any, null as any);
          }
        }
        if (
          this._deathScreen != null &&
          respawningPlayerIndex === this.playerIndex
        ) {
          this._deathScreen.hide();
        }
      }
    }
  }

  notify(
    notification: ClientNotificationType,
    notificationInfo: Map<ClientNotificationInfo, any>
  ): void {
    switch (notification) {
      case ClientNotificationType.disconnectedFromServer: {
        break;
      }
      case ClientNotificationType.receivedEvent: {
        this.registerEvent(notificationInfo.get(ClientNotificationInfo.event));
        break;
      }
    }
  }

  async runTest() {
    this.playerIndex = 0;
    this.position.setToStartingPosition();
    //this.updateBoard(null as any);
  }
}
