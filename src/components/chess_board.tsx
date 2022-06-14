import * as React from "react";
import Box from "@mui/material/Box";
import { Dialog } from "@headlessui/react";
import {
  BOARD_SIZE,
  NUM_OF_PLAYERS,
  PlayingPiece,
  PieceColor,
  colorToString,
  typeToString,
  Move,
  PieceType,
  Square,
  Piece,
  Position,
  WHITE_KING_PLAYER_INDEX,
  BLACK_KING_PLAYER_INDEX,
  reverseColor,
} from "../game_flow_util/game_elements";
import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";

// load piece images
const PIECE_IMAGES: Map<PieceColor, Map<PieceType, any>> = new Map();
for (const color in PieceColor) {
  if (!isNaN(Number(color))) {
    let colorImages: Map<PieceType, any> = new Map();
    for (const type in PieceType) {
      if (!isNaN(Number(type))) {
        let image = new Image();
        image.src = require(`../assets/piece_icons/${colorToString.get(
          +color
        )}_${typeToString.get(+type)}.png`);
        colorImages.set(+type, image);
      }
    }
    PIECE_IMAGES.set(+color, colorImages);
  }
}

const CAPTURE_ICON: any = new Image();
CAPTURE_ICON.src = require(`../assets/gameplay_icons/capture_icon.png`);

const MOVE_BUTTON_OPACITY: number = 0.2;
const PLAYER_SQUARE_BRIGHTNESS: number = 0.4;
const FPS: number = 60;
// in seconds
const PIECE_TRAVEL_TIME: number = 0.2;
const PIECE_DYING_TIME: number = 0.15;
const PIECE_RESPAWNING_TIME: number = 0.15;
const WIPEOUT_BOARD_TRAVEL_TIME = 1;
const DEAD_PIECE_ELEVATION_FACTOR: number = 1;
const WHITE_TIMER_COLOR: string = "#eeeeee";
const BLACK_TIMER_COLOR: string = "#333333";

class CanvasPiece {
  private image: any;
  color: PieceColor;
  opacity: number = 1;
  isMoving: boolean = false;
  isDying: boolean = false;
  isRespawning: boolean = false;

  constructor(
    private ctx: any,
    piece: Piece,
    public x: number,
    public y: number,
    public size: number
  ) {
    this.color = piece.color;
    this.image = PIECE_IMAGES.get(piece.color)?.get(piece.type);
  }

  draw() {
    this.ctx.globalAlpha = this.opacity;
    this.ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    this.ctx.globalAlpha = 1;
  }
}

class CanvasMoveButton {
  constructor(
    private ctx: any,
    public x: number,
    public y: number,
    private squareSize: number,
    private isCapture: boolean,
    private isSelected: boolean
  ) {}

  isPointInBounds(pointX: number, pointY: number): boolean {
    return (
      this.x < pointX &&
      pointX < this.x + this.squareSize &&
      this.y < pointY &&
      pointY < this.y + this.squareSize
    );
  }

  draw() {
    if (this.isSelected) {
      // selected move
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      this.ctx.fillRect(this.x, this.y, this.squareSize, this.squareSize);
    } else if (this.isCapture) {
      // captue move
      this.ctx.globalAlpha = MOVE_BUTTON_OPACITY;
      this.ctx.drawImage(
        CAPTURE_ICON,
        this.x,
        this.y,
        this.squareSize,
        this.squareSize
      );
      this.ctx.globalAlpha = 1;
    } else {
      // standard move
      this.ctx.beginPath();
      this.ctx.arc(
        this.x + this.squareSize / 2,
        this.y + this.squareSize / 2,
        this.squareSize * 0.25,
        0,
        2 * Math.PI
      );
      this.ctx.fillStyle = `rgba(0, 0, 0, ${MOVE_BUTTON_OPACITY})`;
      this.ctx.fill();
      this.ctx.closePath();
    }
  }
}

class CanvasCooldownTimer {
  remainingCooldown: number = 0;

  constructor(
    private ctx: any,
    private x: number,
    private y: number,
    private radius: number,
    private width: number,
    private color: string,
    private cooldownTimer: number
  ) {
    this.remainingCooldown = cooldownTimer;
  }

  draw() {
    if (this.remainingCooldown > 0.01 && this.cooldownTimer > 0) {
      this.ctx.beginPath();
      this.ctx.arc(
        this.x,
        this.y,
        this.radius,
        -Math.PI * 0.5,
        Math.PI * (1.5 - (2 * this.remainingCooldown) / this.cooldownTimer),
        true
      );
      this.ctx.lineWidth = this.width;
      this.ctx.strokeStyle = this.color;
      this.ctx.lineCap = "round";
      this.ctx.stroke();
      this.ctx.lineWidth = 1;
      this.ctx.strokeStyle = "black";
      this.ctx.lineCap = "butt";
      this.ctx.closePath();
    }
  }
}

class BoardArea {
  private povColor: PieceColor = PieceColor.white;
  private squareSize;

  private canvasPieces: CanvasPiece[] = [];
  private canvasMoveButtons: CanvasMoveButton[] = [];
  private selectedMove: CanvasMoveButton = null as any;
  private cooldownTimer: CanvasCooldownTimer = null as any;
  private respawnPreviewPiece: CanvasPiece = null as any;

  private playerSquare: Square = null as any;
  private availableMoves: Move[] = [];

  private isWipeoutAnimationPlaying: boolean = false;

  constructor(private ctx: any, private props: ChessBoardProps) {
    this.povColor = props.povColor;
    this.squareSize = Math.floor(props.size / BOARD_SIZE);
  }

  setPovColor(povColor: PieceColor) {
    this.povColor = povColor;
  }

  setPlayerSquare(playerSquare: Square): void {
    this.playerSquare = playerSquare;
  }

  setPieces(playingPieces: PlayingPiece[]): void {
    this.canvasPieces = playingPieces.map((playingPiece: PlayingPiece) => {
      if (playingPiece.piece == null) {
        return null as any;
      }
      return new CanvasPiece(
        this.ctx,
        playingPiece.piece,
        this.fitColumnIndexToPOV(playingPiece.column) * this.squareSize,
        this.fitRowIndexToPOV(playingPiece.row) * this.squareSize,
        this.squareSize
      );
    });
  }

  setAvailableMoves(availableMoves: Move[]): void {
    this.availableMoves = [...availableMoves];
    this.canvasMoveButtons = availableMoves.map(
      (availableMove: Move) =>
        new CanvasMoveButton(
          this.ctx,
          this.fitColumnIndexToPOV(availableMove.column) * this.squareSize,
          this.fitRowIndexToPOV(availableMove.row) * this.squareSize,
          this.squareSize,
          availableMove.isCapture,
          false
        )
    );
  }

  setSelectedMove(selectedMove: Square): void {
    this.selectedMove =
      selectedMove == null
        ? (null as any)
        : new CanvasMoveButton(
            this.ctx,
            this.fitColumnIndexToPOV(selectedMove.column) * this.squareSize,
            this.fitRowIndexToPOV(selectedMove.row) * this.squareSize,
            this.squareSize,
            false,
            true
          );
  }

  movePlayer(playerIndex: number, row: number, column: number): void {
    let movingPiece: CanvasPiece = this.canvasPieces[playerIndex];
    if (movingPiece != null) {
      movingPiece.isMoving = true;
      let destX: number = this.fitColumnIndexToPOV(column) * this.squareSize;
      let destY: number = this.fitRowIndexToPOV(row) * this.squareSize;
      let dx = (destX - movingPiece.x) / (PIECE_TRAVEL_TIME * FPS);
      let dy = (destY - movingPiece.y) / (PIECE_TRAVEL_TIME * FPS);
      let moveInterval = setInterval(() => {
        movingPiece.x += dx;
        movingPiece.y += dy;
      }, 1000 / FPS);
      setTimeout(() => {
        clearInterval(moveInterval);
        movingPiece.x = destX;
        movingPiece.y = destY;
        movingPiece.isMoving = false;
      }, PIECE_TRAVEL_TIME * 1000);
    }
  }

  startCooldownTimer(cooldownCompletionTime: number): void {
    if (cooldownCompletionTime == null) {
      this.cooldownTimer = null as any;
    } else if (this.playerSquare != null) {
      this.cooldownTimer = new CanvasCooldownTimer(
        this.ctx,
        (this.fitColumnIndexToPOV(this.playerSquare.column) + 0.8) *
          this.squareSize,
        (this.fitRowIndexToPOV(this.playerSquare.row) + 0.2) * this.squareSize,
        this.squareSize * 0.12,
        this.squareSize * 0.05,
        this.povColor === PieceColor.white
          ? WHITE_TIMER_COLOR
          : BLACK_TIMER_COLOR,
        (cooldownCompletionTime - new Date().getTime()) / 1000
      );
      let cooldownTimer: CanvasCooldownTimer = this.cooldownTimer;
      let moveInterval = setInterval(() => {
        cooldownTimer.remainingCooldown =
          (cooldownCompletionTime - new Date().getTime()) / 1000;
      }, 1000 / FPS / 4);
      setTimeout(() => {
        clearInterval(moveInterval);
        if (this.cooldownTimer === cooldownTimer) {
          this.cooldownTimer = null as any;
        }
      }, cooldownCompletionTime - new Date().getTime());
    }
  }

  killPlayer = (playerIndex: number): void => {
    let dyingPiece: CanvasPiece = this.canvasPieces[playerIndex];
    if (dyingPiece != null) {
      dyingPiece.isDying = true;
      let deathElevation = this.squareSize * DEAD_PIECE_ELEVATION_FACTOR;
      let dy = -deathElevation / (PIECE_DYING_TIME * FPS);
      let dOpacity = -1 / (PIECE_DYING_TIME * FPS);
      let deathInterval = setInterval(() => {
        dyingPiece.y += dy;
        dyingPiece.opacity += dOpacity;
      }, 1000 / FPS);
      setTimeout(() => {
        clearInterval(deathInterval);
        this.canvasPieces[playerIndex] = null as any;
      }, PIECE_DYING_TIME * 1000);
    }
  };

  setRespawnPreview(respawnPreviewSquare: Square, respawnPiece: Piece): void {
    if (respawnPreviewSquare == null) {
      this.respawnPreviewPiece = null as any;
    } else {
      let respawnPreviewPiece = new CanvasPiece(
        this.ctx,
        respawnPiece,
        this.fitColumnIndexToPOV(respawnPreviewSquare.column) * this.squareSize,
        this.fitRowIndexToPOV(respawnPreviewSquare.row) * this.squareSize,
        this.squareSize
      );
      respawnPreviewPiece.opacity = 0.2;
      this.respawnPreviewPiece = respawnPreviewPiece;
    }
  }

  respawnPlayer(
    playerIndex: number,
    row: number,
    column: number,
    piece: Piece
  ): void {
    let destY: number = this.fitRowIndexToPOV(row) * this.squareSize;
    let deathElevation = this.squareSize * DEAD_PIECE_ELEVATION_FACTOR;
    this.canvasPieces[playerIndex] = new CanvasPiece(
      this.ctx,
      piece,
      this.fitColumnIndexToPOV(column) * this.squareSize,
      destY - deathElevation,
      this.squareSize
    );
    let respawningPiece: CanvasPiece = this.canvasPieces[playerIndex];
    respawningPiece.opacity = 0;
    respawningPiece.isRespawning = true;
    let dy = deathElevation / (PIECE_RESPAWNING_TIME * FPS);
    let dOpacity = 1 / (PIECE_RESPAWNING_TIME * FPS);
    let respawnInterval = setInterval(() => {
      respawningPiece.y += dy;
      respawningPiece.opacity += dOpacity;
    }, 1000 / FPS);
    setTimeout(() => {
      clearInterval(respawnInterval);
      respawningPiece.y = destY;
      respawningPiece.opacity = 1;
      respawningPiece.isRespawning = false;
    }, PIECE_RESPAWNING_TIME * 1000);
  }

  promotePlayer(playerIndex: number, promotionPiece: Piece): void {
    let previousCanvasPiece = this.canvasPieces[playerIndex];
    if (!previousCanvasPiece.isMoving) {
      this.canvasPieces[playerIndex] = new CanvasPiece(
        this.ctx,
        promotionPiece,
        previousCanvasPiece.x,
        previousCanvasPiece.y,
        previousCanvasPiece.size
      );
    }
  }

  playWipeoutAnimation(originSquare: Square, dyingTeamColor: PieceColor) {
    this.isWipeoutAnimationPlaying = true;
    let originX: number =
      this.fitColumnIndexToPOV(originSquare.column) * this.squareSize;
    let originY: number =
      this.fitRowIndexToPOV(originSquare.row) * this.squareSize;
    for (let i = 0; i < this.canvasPieces.length; i++) {
      let canvasPiece: CanvasPiece = this.canvasPieces[i];
      if (canvasPiece != null && canvasPiece.color === dyingTeamColor) {
        setTimeout(() => {
          this.killPlayer(i);
        }, (Math.sqrt(Math.pow(canvasPiece.x - originX, 2) + Math.pow(canvasPiece.y - originY, 2)) / this.props.size) * WIPEOUT_BOARD_TRAVEL_TIME * 1000);
      }
    }
    setTimeout(() => {
      this.isWipeoutAnimationPlaying = false;
    }, 2 * WIPEOUT_BOARD_TRAVEL_TIME * 1000);
  }

  mouseClicked(x: number, y: number) {
    if (this.selectedMove == null) {
      for (let i = 0; i < this.availableMoves.length; i++) {
        if (this.canvasMoveButtons[i].isPointInBounds(x, y)) {
          this.props.clientFlowEngine.sendMove(this.availableMoves[i]);
        }
      }
    } else {
      if (this.selectedMove.isPointInBounds(x, y)) {
        this.props.clientFlowEngine.sendMove(null as any);
      }
    }
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.props.size, this.props.size);
  }

  private fitRowIndexToPOV(rowIndex: number): number {
    return this.povColor === PieceColor.white
      ? BOARD_SIZE - 1 - rowIndex
      : rowIndex;
  }

  private fitColumnIndexToPOV(columnIndex: number): number {
    return this.povColor === PieceColor.white
      ? columnIndex
      : BOARD_SIZE - 1 - columnIndex;
  }

  // return wehther or not there's a need for an update
  draw(): boolean {
    let shouldUpdate: boolean = this.isWipeoutAnimationPlaying;
    let { size, lightColor, darkColor } = this.props;
    let coordinateIndexFontSize: number = size * 0.035;
    // squares
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        this.ctx.fillStyle = (i + j) % 2 === 0 ? lightColor : darkColor;
        this.ctx.fillRect(
          i * this.squareSize,
          j * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      }
    }
    // row indices
    for (let i = 0; i < BOARD_SIZE; i++) {
      this.ctx.font = `${coordinateIndexFontSize}px Arial`;
      this.ctx.fillStyle =
        this.fitRowIndexToPOV(i) % 2 === 0 ? darkColor : lightColor;
      this.ctx.fillText(
        (i + 1).toString(),
        this.squareSize * 0.05,
        (this.fitRowIndexToPOV(i) + 0.25) * this.squareSize
      );
    }
    // column indices
    for (let i = 0; i < BOARD_SIZE; i++) {
      this.ctx.font = `${coordinateIndexFontSize}px Arial`;
      this.ctx.fillStyle =
        this.fitColumnIndexToPOV(i) % 2 === 0 ? lightColor : darkColor;
      this.ctx.fillText(
        String.fromCharCode("a".charCodeAt(0) + i),
        (this.fitColumnIndexToPOV(i) + 0.75) * this.squareSize,
        (BOARD_SIZE - 0.08) * this.squareSize
      );
    }
    // player square highlight
    if (this.playerSquare != null) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${PLAYER_SQUARE_BRIGHTNESS})`;
      this.ctx.fillRect(
        this.fitColumnIndexToPOV(this.playerSquare.column) * this.squareSize,
        this.fitRowIndexToPOV(this.playerSquare.row) * this.squareSize,
        this.squareSize,
        this.squareSize
      );
    }
    // dying pieces
    for (let canvasPiece of this.canvasPieces) {
      if (canvasPiece != null && canvasPiece.isDying) {
        canvasPiece.draw();
        shouldUpdate = true;
      }
    }
    // non-moving pieces
    for (let canvasPiece of this.canvasPieces) {
      if (
        canvasPiece != null &&
        !canvasPiece.isMoving &&
        !canvasPiece.isDying &&
        !canvasPiece.isRespawning
      ) {
        canvasPiece.draw();
      }
    }
    // respawning pieces
    for (let canvasPiece of this.canvasPieces) {
      if (
        canvasPiece != null &&
        canvasPiece.isRespawning &&
        !canvasPiece.isDying
      ) {
        canvasPiece.draw();
        shouldUpdate = true;
      }
    }
    // moving pieces
    for (let canvasPiece of this.canvasPieces) {
      if (
        canvasPiece != null &&
        canvasPiece.isMoving &&
        !canvasPiece.isDying &&
        !canvasPiece.isRespawning
      ) {
        canvasPiece.draw();
        shouldUpdate = true;
      }
    }
    // respawn preview
    if (this.respawnPreviewPiece != null) {
      this.respawnPreviewPiece.draw();
    }
    // move buttons
    if (this.selectedMove == null) {
      for (let canvasMoveButton of this.canvasMoveButtons) {
        canvasMoveButton.draw();
      }
    } else {
      // selected move
      this.selectedMove.draw();
    }
    // cooldown timer
    if (this.cooldownTimer != null) {
      this.cooldownTimer.draw();
      shouldUpdate = true;
    }
    return shouldUpdate;
  }
}

interface ChessBoardProps {
  size: number;
  lightColor: string;
  darkColor: string;
  povColor: PieceColor;
  clientFlowEngine: ClientFlowEngine;
}

interface ChessBoardState {}

class ChessBoard
  extends React.Component<ChessBoardProps, ChessBoardState>
  implements ClientFlowEngineObserver
{
  state = {};

  isGameRunning: boolean = false;
  playerIndex: number = null as any;
  selectedMove: Square = null as any;
  isOnCooldown: boolean = false;
  cooldownTimeout: any = null;
  kingDeathSquare: Square = null as any;

  canvasRef = null as any;
  boardArea: BoardArea = null as any;
  shouldUpdateBoard: boolean = false;

  constructor(props: ChessBoardProps) {
    super(props);
    this.canvasRef = React.createRef();
  }

  private renderFunction = () => {
    if (this.shouldUpdateBoard) {
      this.shouldUpdateBoard = false;
      this.boardArea.clear();
      this.shouldUpdateBoard = this.boardArea.draw();
    }
    requestAnimationFrame(this.renderFunction);
  };

  componentDidMount() {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    this.boardArea = new BoardArea(ctx, this.props);
    let rect = canvas.getBoundingClientRect();
    canvas.addEventListener("mousedown", (event: any) => {
      this.boardArea.mouseClicked(event.x - rect.left, event.y - rect.top);
    });
    this.shouldUpdateBoard = true;
    let clientFlowEngine: ClientFlowEngine = this.props.clientFlowEngine;
    if (clientFlowEngine != null) {
      if (clientFlowEngine.playerIndex != null) {
        this.assignRole(clientFlowEngine.playerIndex);
      }
      clientFlowEngine.addObserver(this);
    }
    requestAnimationFrame(this.renderFunction);
  }

  componentWillUnmount() {
    let clientFlowEngine: ClientFlowEngine = this.props.clientFlowEngine;
    if (clientFlowEngine != null) {
      clientFlowEngine.removeObserver(this);
    }
  }

  private setPovColor(povColor: PieceColor): void {
    this.boardArea.setPovColor(povColor);
    this.shouldUpdateBoard = true;
  }

  private setPlayerSquare(playerSquare: Square): void {
    this.boardArea.setPlayerSquare(playerSquare);
    this.shouldUpdateBoard = true;
  }

  private setPieces(playingPieces: PlayingPiece[]): void {
    this.boardArea.setPieces(playingPieces);
    this.shouldUpdateBoard = true;
  }

  private setAvailableMoves(availableMoves: Move[]): void {
    this.boardArea.setAvailableMoves(availableMoves);
    this.shouldUpdateBoard = true;
  }

  private setSelectedMove(selectedMove: Square): void {
    this.selectedMove = selectedMove;
    this.boardArea.setSelectedMove(selectedMove);
    this.shouldUpdateBoard = true;
  }

  private movePlayer(playerIndex: number, row: number, column: number): void {
    this.boardArea.movePlayer(playerIndex, row, column);
    this.shouldUpdateBoard = true;
  }

  private startCooldownTimer(cooldownCompletionTime: number): void {
    if (this.cooldownTimeout != null) {
      clearTimeout(this.cooldownTimeout);
    }
    if (cooldownCompletionTime == null) {
      this.isOnCooldown = false;
    } else {
      this.isOnCooldown = true;
      this.cooldownTimeout = setTimeout(() => {
        this.isOnCooldown = false;
      }, cooldownCompletionTime - new Date().getTime());
    }
    this.boardArea.startCooldownTimer(cooldownCompletionTime);
  }

  private killPlayer(playerIndex: number): void {
    this.boardArea.killPlayer(playerIndex);
    this.shouldUpdateBoard = true;
  }

  private setRespawnPreview(
    respawnPreviewSquare: Square,
    respawnPiece: Piece
  ): void {
    this.boardArea.setRespawnPreview(respawnPreviewSquare, respawnPiece);
    this.shouldUpdateBoard = true;
  }

  private respawnPlayer(
    playerIndex: number,
    row: number,
    column: number,
    piece: Piece
  ): void {
    this.boardArea.respawnPlayer(playerIndex, row, column, piece);
    this.shouldUpdateBoard = true;
  }

  private promotePlayer = (
    playerIndex: number,
    promotionPiece: Piece
  ): void => {
    this.boardArea.promotePlayer(playerIndex, promotionPiece);
    this.shouldUpdateBoard = true;
  };

  private playWipeoutAnimation(
    originSquare: Square,
    dyingTeamColor: PieceColor
  ) {
    this.boardArea.playWipeoutAnimation(originSquare, dyingTeamColor);
    this.shouldUpdateBoard = true;
  }

  private assignRole(playerIndex: number) {
    this.isGameRunning = true;
    this.kingDeathSquare = null as any;
    if (this.boardArea != null) {
      this.playerIndex = playerIndex;
      let position: Position = this.props.clientFlowEngine.getPosition();
      let povColor: PieceColor = position.getPieceByPlayer(playerIndex).color;
      this.setPovColor(povColor);
      this.setPlayerSquare(position.getPlayerLocation(playerIndex));
      this.setPieces(position.playingPieces);
    }
  }

  private startGame(initialCooldown: number): void {
    if (this.isGameRunning) {
      this.startCooldownTimer(initialCooldown);
      this.setSelectedMove(null as any);
      this.updateRespawnPreviewAndAvailableMoves();
    }
  }

  private endGame(winningColor: PieceColor) {
    if (this.isGameRunning) {
      this.setAvailableMoves([]);
      this.setSelectedMove(null as any);
      if (
        winningColor !== Position.getStartPieceByPlayer(this.playerIndex).color
      ) {
        this.setPlayerSquare(null as any);
      }
      this.playWipeoutAnimation(
        this.kingDeathSquare == null ? new Square(0, 0) : this.kingDeathSquare,
        reverseColor(winningColor)
      );
      this.isGameRunning = false;
    }
  }

  private updateRespawnPreviewAndAvailableMoves() {
    if (this.isGameRunning) {
      let position: Position = this.props.clientFlowEngine.getPosition();
      let isPlayerAlive: boolean = position.isPlayerAlive(this.playerIndex);
      this.setRespawnPreview(
        isPlayerAlive
          ? (null as any)
          : position.getRespawnSquareForPlayer(this.playerIndex),
        isPlayerAlive
          ? (null as any)
          : Position.getStartPieceByPlayer(this.playerIndex)
      );
      this.setAvailableMoves(
        isPlayerAlive
          ? position.findAvaillableMovesForPlayer(this.playerIndex)
          : []
      );
    }
  }

  private move(movingPlayerIndex: number, move: Move, cooldown: number): void {
    if (this.isGameRunning) {
      let position: Position = this.props.clientFlowEngine.getPosition();
      if (movingPlayerIndex === this.playerIndex) {
        this.setPlayerSquare(new Square(move.row, move.column));
        this.startCooldownTimer(new Date().getTime() + cooldown * 1000);
        this.setSelectedMove(null as any);
      }
      this.movePlayer(movingPlayerIndex, move.row, move.column);
      let availableMoves: Move[] = position.findAvaillableMovesForPlayer(
        this.playerIndex
      );
      this.setAvailableMoves(availableMoves);
      this.updateRespawnPreviewAndAvailableMoves();
    }
  }

  private promote(promotingPlayerIndex: number, promotionPiece: Piece) {
    if (this.isGameRunning) {
      setTimeout(() => {
        this.promotePlayer(promotingPlayerIndex, promotionPiece);
        this.updateRespawnPreviewAndAvailableMoves();
      }, PIECE_TRAVEL_TIME * 1000 * 1.3);
    }
  }

  private kill(dyingPlayerIndex: number) {
    if (this.isGameRunning) {
      this.killPlayer(dyingPlayerIndex);
      if (dyingPlayerIndex == this.playerIndex) {
        this.setPlayerSquare(null as any);
        this.startCooldownTimer(null as any);
        this.setSelectedMove(null as any);
        this.updateRespawnPreviewAndAvailableMoves();
      }
      if (
        dyingPlayerIndex === WHITE_KING_PLAYER_INDEX ||
        dyingPlayerIndex === BLACK_KING_PLAYER_INDEX
      ) {
        this.kingDeathSquare = this.props.clientFlowEngine
          .getPosition()
          .getPlayerLocation(dyingPlayerIndex);
      }
    }
  }

  private respawn(respawningPlayerIndex: number, respawnSquare: Square) {
    if (this.isGameRunning) {
      this.respawnPlayer(
        respawningPlayerIndex,
        respawnSquare.row,
        respawnSquare.column,
        Position.getStartPieceByPlayer(respawningPlayerIndex)
      );
      if (respawningPlayerIndex === this.playerIndex) {
        this.setPlayerSquare(respawnSquare);
      }
      this.updateRespawnPreviewAndAvailableMoves();
    }
  }

  private moveSent(sentMove: Move) {
    if (this.isGameRunning) {
      if (
        this.isOnCooldown &&
        (sentMove == null || !sentMove.isMissingPromotionType())
      ) {
        this.selectedMove =
          sentMove == null
            ? (null as any)
            : new Square(sentMove.row, sentMove.column);
        this.setSelectedMove(this.selectedMove);
      }
    }
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.roleAssigned: {
        this.assignRole(info.get(ClientEventInfo.playerIndex));
        break;
      }
      case ClientEventType.gameStarted: {
        this.startGame(info.get(ClientEventInfo.initialCooldown));
        break;
      }
      case ClientEventType.gameEnded: {
        this.endGame(info.get(ClientEventInfo.winningColor));
        break;
      }
      case ClientEventType.move: {
        this.move(
          info.get(ClientEventInfo.movingPlayerIndex),
          info.get(ClientEventInfo.move),
          info.get(ClientEventInfo.cooldown)
        );
        break;
      }
      case ClientEventType.promotion: {
        this.promote(
          info.get(ClientEventInfo.promotingPlayerIndex),
          info.get(ClientEventInfo.promotionPiece)
        );
        break;
      }
      case ClientEventType.death: {
        this.kill(info.get(ClientEventInfo.dyingPlayerIndex));
        break;
      }
      case ClientEventType.respawn: {
        this.respawn(
          info.get(ClientEventInfo.respawningPlayerIndex),
          info.get(ClientEventInfo.respawnSquare)
        );
        break;
      }
      case ClientEventType.moveSent: {
        this.moveSent(info.get(ClientEventInfo.sentMove));
        break;
      }
    }
  }

  render() {
    let { size } = this.props;
    return (
      <div>
        <canvas ref={this.canvasRef} width={size} height={size} />
      </div>
    );
  }
}

export default ChessBoard;
