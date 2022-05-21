import {
  GameClient,
  ClientNotificationType,
  ClientNotificationInfo,
  ClientObserver,
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
  PlayerListComponent
} from "../components/game_component_interfaces";
import {
  Event,
  EventInfo,
  EventType,
  GameStatus,
  reviver,
} from "../game_flow_util/communication";
import { User } from "../database/database_util";

export class ClientFlowEngine implements ClientObserver {
  public targetServerIndex: number = null as any;

  private gameClient: GameClient;
  private position: Position = null as any;
  private _board: ChessBoardComponent = null as any;
  private _graveYard: GraveYardComponent = null as any;
  private _deathScreen: DeathScreenComponent = null as any;
  private _promotionScreen: PromotionScreenComponent = null as any;
  private _playerList: PlayerListComponent = null as any;

  private playerIndex: number = null as any;
  private playerID: string;

  private selectedMove: Square = null as any;

  // debug
  public shouldStopSimulation: boolean = false;
  private receivedEventIndices: number[] = [];

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

  set playerList(playerList: PlayerListComponent) {
    this._playerList = playerList;
  }

  async attemptToConnect(gameID: string) {
    if (this.targetServerIndex != null) {
      let connectionStatus: ConnectionStatus = await this.gameClient.attemptToConnect(
        gameID,
        this.targetServerIndex
      );
      console.log(`${this.playerID}: ${connectionStatus}`);
    }
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

  private killPlayer(dyingPlayerIndex: number, respawnTimer: number): void {
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

  private updatePlayerList(connectedPlayers: User[]): void {
    if (this._playerList != null) {
      console.log("here5");
      this._playerList.setPlayers([...connectedPlayers]);
    }
  }

  private startGame(playerIndex: number, initialCooldown: number): void {
    this.playerIndex = playerIndex;
    this.gameClient.playerIndex = playerIndex;
    this.gameClient.gameStatus = GameStatus.running;
    this.position = new Position(`client ${playerIndex}`);
    this.position.setToStartingPosition();
    let povColor: PieceColor = this.position.getPieceByPlayer(this.playerIndex)
      .color;
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
  }

  private async registerEvent(event: Event) {
    this.receivedEventIndices.push(event.index);
    switch (event.type) {
      // player list update
      case EventType.playerListUpdate: {
        console.log("here4");
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
