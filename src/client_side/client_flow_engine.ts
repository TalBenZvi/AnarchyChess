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
  GameEvent,
  GameEventInfo,
  GameEventType,
  GAME_START_DELAY,
  User,
} from "../communication/communication_util";
import { Lobby } from "../communication/communication_util";
import { PlayerList } from "../game_flow_util/player_list";

export enum ClientEventType {
  joinedNewLobby,
  disconnectedFromLobby,
  playerListUpdate,
  roleAssigned,
  gameStarted,
  gameEnded,
  returnToLobby,
  move,
  promotion,
  death,
  respawn,
  moveSent,
}

export enum ClientEventInfo {
  // joinedNewLobby, playerListUpdate
  playerList,
  // roleAssigned
  playerIndex,
  // gameStarted
  initialCooldown,
  //gameEnded
  winningColor,
  // move
  movingPlayerIndex,
  move,
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

export class ClientFlowEngine {
  private _currentLobby: Lobby = null as any;
  playerList: PlayerList = new PlayerList(false);

  isGameRunning: boolean = false;
  private position: Position = null as any;
  private _playerIndex: number = null as any;
  private selectedMove: Square = null as any;
  private gameStartTimeout: any = null;

  private observers: ClientFlowEngineObserver[] = [];

  constructor(private _user: User, private _sendMove: (move: Move) => void) {}

  get playerIndex(): number {
    return this._playerIndex;
  }

  get currentLobby(): Lobby {
    return { ...this._currentLobby };
  }

  get user(): User {
    return this._user;
  }

  addObserver(observer: ClientFlowEngineObserver) {
    this.observers.push(observer);
  }

  removeObserver(observerToRemove: ClientFlowEngineObserver) {
    this.observers = this.observers.filter(
      (observer: ClientFlowEngineObserver) => observer !== observerToRemove
    );
  }

  private notifyObservers(
    eventType: ClientEventType,
    info: Map<ClientEventInfo, any>
  ) {
    for (let observer of this.observers) {
      observer.notify(eventType, info);
    }
  }

  setLobby(lobby: Lobby, playerListJSON: string): void {
    this._currentLobby = lobby;
    this.playerList.setFromJSON(playerListJSON);
    this.notifyPlayerListUpdate();
  }

  getPosition(): Position {
    return this.position;
  }

  sendMove(move: Move): void {
    if (this.isGameRunning) {
      if (move == null || !move.isMissingPromotionType()) {
        // this.gameClient.sendMove(move);
        this._sendMove(move);
        this.selectedMove =
          move == null ? (null as any) : new Square(move.row, move.column);
      }
      this.notifyObservers(
        ClientEventType.moveSent,
        new Map<ClientEventInfo, any>([[ClientEventInfo.sentMove, move]])
      );
    }
  }

  private reexamineSelectedMove() {
    if (
      this.selectedMove != null &&
      this.position.locateMoveForPlayer(
        this._playerIndex,
        new Move(this.selectedMove.row, this.selectedMove.column)
      ) == null
    ) {
      this.selectedMove = null as any;
      this.sendMove(null as any);
    }
  }

  private killPlayer(dyingPlayerIndex: number, deathTimer: number): void {
    this.notifyObservers(
      ClientEventType.death,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.dyingPlayerIndex, dyingPlayerIndex],
        [ClientEventInfo.deathTimer, deathTimer],
      ])
    );
    this.position.killPlayer(dyingPlayerIndex);
  }

  private notifyPlayerListUpdate(): void {
    this.notifyObservers(
      ClientEventType.playerListUpdate,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.playerList, this.playerList],
      ])
    );
  }

  private startGame(playerIndex: number, initialCooldown: number): void {
    this.isGameRunning = true;
    this._playerIndex = playerIndex;
    this.position = new Position(`client ${playerIndex}`);
    this.position.setToStartingPosition();
    this.notifyObservers(
      ClientEventType.roleAssigned,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.playerIndex, playerIndex],
      ])
    );
    this.gameStartTimeout = setTimeout(() => {
      this.notifyObservers(
        ClientEventType.gameStarted,
        new Map<ClientEventInfo, any>([
          [ClientEventInfo.initialCooldown, initialCooldown],
        ])
      );
    }, GAME_START_DELAY * 1000);
  }

  private endGame(winningColor: PieceColor): void {
    this.notifyObservers(
      ClientEventType.gameEnded,
      new Map<ClientEventInfo, any>([
        [ClientEventInfo.winningColor, winningColor],
      ])
    );
    this.isGameRunning = false;
    this.selectedMove = null as any;
    this._playerIndex = null as any;
  }

  private returnToLobby(): void {
    if (this.gameStartTimeout !== null) {
      clearTimeout(this.gameStartTimeout);
    }
    this.notifyObservers(
      ClientEventType.returnToLobby,
      new Map<ClientEventInfo, any>()
    );
    this.isGameRunning = false;
    this.selectedMove = null as any;
    this._playerIndex = null as any;
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
    this.reexamineSelectedMove();
  }

  registerEvent(event: GameEvent) {
    switch (event.type) {
      // disconnected from lobby
      case GameEventType.disconnectedFromLobby: {
        this.notifyObservers(ClientEventType.disconnectedFromLobby, new Map());
        this._currentLobby = null as any;
        break;
      }
      // player list update
      case GameEventType.playerListUpdate: {
        this.playerList.setFromJSON(
          event.info.get(GameEventInfo.playerListJSON)
        );
        this.notifyPlayerListUpdate();
        break;
      }
      // game started
      case GameEventType.gameStarted: {
        this.startGame(
          event.info.get(GameEventInfo.playerIndex),
          event.info.get(GameEventInfo.initialCooldown)
        );
        break;
      }
      // game ended
      case GameEventType.gameEnded: {
        this.endGame(event.info.get(GameEventInfo.winningColor));
        break;
      }
      // return to lobby
      case GameEventType.returnToLobby: {
        this.returnToLobby();
        break;
      }
      // move
      case GameEventType.move: {
        let moveNotification: Move = event.info.get(GameEventInfo.move);
        let movingPlayerIndex: number = event.info.get(
          GameEventInfo.playerIndex
        );
        let move: Move = this.position.locateMoveForPlayer(
          event.info.get(GameEventInfo.playerIndex),
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
            let respawnTimer: number = event.info.get(
              GameEventInfo.respawnTimer
            );
            this.killPlayer(dyingPlayerIndex, respawnTimer);
          }
          // isEnpassant
          if (move.isEnPassant) {
            let enPassantedPlayerIndex = this.position.playerAt(
              movingPlayerLocation.row,
              move.column
            );
            let respawnTimer: number = event.info.get(
              GameEventInfo.enPassantRespawnTimer
            );
            this.killPlayer(enPassantedPlayerIndex, respawnTimer);
          }
          // execute move
          this.position.move(movingPlayerIndex, move.row, move.column);
          let cooldownTimer: number = event.info.get(GameEventInfo.cooldown);
          this.notifyObservers(
            ClientEventType.move,
            new Map<ClientEventInfo, any>([
              [ClientEventInfo.movingPlayerIndex, movingPlayerIndex],
              [ClientEventInfo.move, move],
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
                [ClientEventInfo.move, new Square(startRow, destColumn)],
                [ClientEventInfo.cooldown, 0],
              ])
            );
          }
        }
        this.reexamineSelectedMove();
        break;
      }
      // respawn
      case GameEventType.respawn: {
        this.respawnPlayer(
          event.info.get(GameEventInfo.playerIndex),
          event.info.get(GameEventInfo.respawnSquare)
        );
        break;
      }
    }
  }
}
