import * as React from "react";
import "./chess_board.css";
import Box from "@mui/material/Box";
import { Dialog } from "@headlessui/react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import {
  ChessBoardComponent,
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
  Knight,
} from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

import captureIcon from "../assets/action_icons/capture_icon.png";
import BoardComponent from "./chess_board";
import { ContextProvider } from "recyclerlistview/web";

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

const PROMOTION_TYPES: PieceType[] = [
  PieceType.knight,
  PieceType.bishop,
  PieceType.rook,
  PieceType.queen,
];

interface TestComponentProps {
  size: number;
  lightColor: string;
  darkColor: string;
  povColor: PieceColor;
  clientFlowEngine: ClientFlowEngine;
}

interface TestComponentState {}

class CanvasPiece {
  image: any;
  vx: number = 0;
  vy: number = 0;
  isLoaded: boolean = false;
  constructor(
    private ctx: any,
    piece: Piece,
    public x: number,
    public y: number,
    public size: number
  ) {
    this.image = PIECE_IMAGES.get(piece.color)?.get(piece.type);
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  draw() {
    this.ctx.drawImage(this.image, this.x, this.y, this.size, this.size);
    /*
    this.ctx.fillStyle = "#0000ff";
    this.ctx.fillRect(
      this.x,
      this.y,
      this.size / 2,
      this.size / 2,
    );
    */
  }
}

class CanvasMoveButton {
  constructor(
    private ctx: any,
    public x: number,
    public y: number,
    private squareSize: number
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
    this.ctx.beginPath();
    this.ctx.arc(
      this.x + this.squareSize / 2,
      this.y + this.squareSize / 2,
      this.squareSize * 0.25,
      0,
      2 * Math.PI
    );
    this.ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    this.ctx.fill();
    this.ctx.closePath();
  }
}

class BoardArea {
  povColor: PieceColor = PieceColor.white;
  private canvasPieces: CanvasPiece[] = [];
  private canvasMoveButtons: CanvasMoveButton[] = [];
  private drawnImageIndex = 0;

  private availableMoves: Move[] = [];

  constructor(private ctx: any, private props: TestComponentProps) {
    this.povColor = props.povColor;
    this.povColor = PieceColor.white;
  }

  setPieces(playingPieces: PlayingPiece[]) {
    let squareSize: number = this.props.size / BOARD_SIZE;
    this.canvasPieces = playingPieces.map((playingPiece: PlayingPiece) => {
      if (playingPiece.piece == null) {
        return null as any;
      }
      return new CanvasPiece(
        this.ctx,
        playingPiece.piece,
        this.fitColumnIndexToPOV(playingPiece.column) * squareSize,
        this.fitRowIndexToPOV(playingPiece.row) * squareSize,
        squareSize
      );
    });
    this.canvasPieces.filter((canvasPiece) => canvasPiece != null);
  }

  setAvailableMoves(availableMoves: Move[]) {
    this.availableMoves = [...availableMoves];
    let squareSize: number = this.props.size / BOARD_SIZE;
    this.canvasMoveButtons = availableMoves.map(
      (availableMove: Move) =>
        new CanvasMoveButton(
          this.ctx,
          this.fitColumnIndexToPOV(availableMove.column) * squareSize,
          this.fitRowIndexToPOV(availableMove.row) * squareSize,
          squareSize
        )
    );
  }

  mouseClicked(x: number, y: number) {
    for (let i = 0; i < this.availableMoves.length; i++) {
      if (this.canvasMoveButtons[i].isPointInBounds(x, y)) {
        this.props.clientFlowEngine.sendMove(this.availableMoves[i]);
      }
    }
  }

  clear() {
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

  update() {}

  // return wehther or not there's a need for an update
  draw(): boolean {
    let {
      size,
      lightColor,
      darkColor,
      povColor,
      clientFlowEngine,
    } = this.props;
    let squareSize: number = size / BOARD_SIZE;
    let coordinateIndexFontSize: number = size * 0.035;
    // squares
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        this.ctx.fillStyle = (i + j) % 2 === 0 ? lightColor : darkColor;
        this.ctx.fillRect(
          i * squareSize,
          j * squareSize,
          squareSize,
          squareSize
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
        squareSize * 0.05,
        (this.fitRowIndexToPOV(i) + 0.25) * squareSize
      );
    }
    // column indices
    for (let i = 0; i < BOARD_SIZE; i++) {
      this.ctx.font = `${coordinateIndexFontSize}px Arial`;
      this.ctx.fillStyle =
        this.fitColumnIndexToPOV(i) % 2 === 0 ? lightColor : darkColor;
      this.ctx.fillText(
        String.fromCharCode("a".charCodeAt(0) + i),
        (this.fitColumnIndexToPOV(i) + 0.75) * squareSize,
        (BOARD_SIZE - 0.08) * squareSize
      );
    }
    // pieces
    /*
    for (let canvasPiece of this.canvasPieces) {
      if (!canvasPiece.isLoaded) {
        return true;
      }
    }
    */
    for (let canvasPiece of this.canvasPieces) {
      canvasPiece.draw();
    }
    // move buttons
    for (let canvasMoveButton of this.canvasMoveButtons) {
      canvasMoveButton.draw();
    }
    return false;
  }
}

class TestComponent
  extends React.Component<TestComponentProps, TestComponentState>
  implements ChessBoardComponent {
  state = {};
  canvasRef = null as any;
  boardArea: BoardArea = null as any;
  shouldUpdateBoard: boolean = false;

  constructor(props: TestComponentProps) {
    super(props);
    this.canvasRef = React.createRef();
    props.clientFlowEngine.board = this;
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
    requestAnimationFrame(this.renderFunction);
  }

  setPlayerIndex(playerIndex: number): void {}

  setPovColor(povColor: PieceColor): void {}

  setPieces(
    playingPieces: PlayingPiece[],
    availableMoves: Move[],
    movingPieceIndex: number,
    cooldownTimer: number,
    remainingCooldown: number,
    selectedMove: Square,
    respawnSquare: Square,
    respawnPiece: Piece
  ): void {
    this.boardArea.setPieces(playingPieces);
    this.boardArea.setAvailableMoves(availableMoves);
    this.shouldUpdateBoard = true;
  }

  private sendMove(move: Move): void {
    this.props.clientFlowEngine.sendMove(move);
  }

  private openPromotionDialog(move: Move) {}

  private closePromotionDialog(): void {}

  render() {
    let { size, lightColor, darkColor } = this.props;
    return (
      <div>
        <canvas ref={this.canvasRef} width={size} height={size} />
      </div>
    );
  }
}

export default TestComponent;
