export const BOARD_SIZE = 8;

export const NUM_OF_PLAYERS = 32;

export const WHITE_KING_PLAYER_INDEX = 4;
export const BLACK_KING_PLAYER_INDEX = 28;

export enum PieceType {
  pawn,
  knight,
  bishop,
  rook,
  queen,
  king,
}

export const typeToString = new Map<PieceType, string>([
  [PieceType.pawn, "pawn"],
  [PieceType.knight, "knight"],
  [PieceType.bishop, "bishop"],
  [PieceType.rook, "rook"],
  [PieceType.queen, "queen"],
  [PieceType.king, "king"],
]);

export enum PieceColor {
  white,
  black,
}

export const colorToString = new Map<PieceColor, string>([
  [PieceColor.white, "white"],
  [PieceColor.black, "black"],
]);

export const reverseColor = (color: PieceColor): PieceColor =>
  color === PieceColor.white ? PieceColor.black : PieceColor.white;

const pieceCooldowns: Map<PieceType, number> = new Map([
  [PieceType.pawn, 1],
  [PieceType.knight, 1.5],
  [PieceType.bishop, 1.5],
  [PieceType.rook, 1.5],
  [PieceType.queen, 2],
  [PieceType.king, 0.75],
]);

const pieceRespawnTimers: Map<PieceType, number> = new Map([
  [PieceType.pawn, 1.5],
  [PieceType.knight, 4],
  [PieceType.bishop, 4],
  [PieceType.rook, 4],
  [PieceType.queen, 5],
  [PieceType.king, 999],
]);

class MoveOffset {
  constructor(public rowOffset: number, public columnOffset: number) {}
}

export class Square {
  constructor(readonly row: number, readonly column: number) {
    this.applyMove = this.applyMove.bind(this);
  }

  isOnTheBoard = (): boolean =>
    0 <= this.row &&
    this.row < BOARD_SIZE &&
    0 <= this.column &&
    this.column < BOARD_SIZE;

  applyMove = (moveOffset: MoveOffset) =>
    new Square(
      this.row + moveOffset.rowOffset,
      this.column + moveOffset.columnOffset
    );
}

// returns a list of the squares of the first 4 rows stating with 'startRow'
const firstFourRows = (startRow: number): Square[] =>
  [...Array(NUM_OF_PLAYERS)].map(
    (_, i) => new Square(startRow + Math.floor(i / BOARD_SIZE), i % BOARD_SIZE)
  );

export enum CastleSide {
  kingSide,
  queenSide,
}

interface OptionalMoveParams {
  isPromotion?: boolean;
  promotionType?: PieceType;
  isCapture?: boolean;
  isEnPassant?: boolean;
  isCastle?: boolean;
  castleSide?: CastleSide;
}

export class Move {
  isPromotion: boolean = false;
  promotionType: PieceType = null as any;
  isCapture: boolean = false;
  isEnPassant: boolean = false;
  isCastle: boolean = false;
  castleSide?: CastleSide = null as any;

  constructor(
    public row: number,
    public column: number,
    params?: OptionalMoveParams
  ) {
    if (params != null) {
      this.isPromotion = Boolean(params.isPromotion);
      this.promotionType = (
        Boolean(params.promotionType) ? params.promotionType : null
      ) as PieceType;
      this.isCapture = Boolean(params.isCapture);
      this.isEnPassant = Boolean(params.isEnPassant);
      this.isCastle = Boolean(params.isCastle);
      this.castleSide = params.castleSide;
    }
  }

  isMissingPromotionType(): boolean {
    return this.isPromotion && this.promotionType == null;
  }
}

export abstract class Piece {
  private _respawnSquares: Square[];

  constructor(public color: PieceColor, protected startColumn: number) {
    if (startColumn == null) {
      this._respawnSquares = [];
    } else {
      switch (color) {
        case PieceColor.white: {
          let startRow = this.getType() === PieceType.pawn ? 1 : 0;
          this._respawnSquares = firstFourRows(startRow).sort(
            (square1, square2) => {
              if (square1.row !== square2.row) {
                return square1.row - square2.row;
              }
              return (
                Math.abs(square1.column - startColumn) -
                Math.abs(square2.column - startColumn)
              );
            }
          );
          break;
        }
        case PieceColor.black: {
          let startRow = this.getType() === PieceType.pawn ? 3 : 4;
          this._respawnSquares = firstFourRows(startRow).sort(
            (square1, square2) => {
              if (square1.row !== square2.row) {
                return square2.row - square1.row;
              }
              return (
                Math.abs(square1.column - startColumn) -
                Math.abs(square2.column - startColumn)
              );
            }
          );
          break;
        }
      }
    }
  }

  static generate(type: PieceType, color: PieceColor): Piece {
    switch (type) {
      case PieceType.pawn: {
        return new Pawn(color, null as any);
      }
      case PieceType.knight: {
        return new Knight(color, null as any);
      }
      case PieceType.bishop: {
        return new Bishop(color, null as any);
      }
      case PieceType.rook: {
        return new Rook(color, null as any);
      }
      case PieceType.queen: {
        return new Queen(color, null as any);
      }
      case PieceType.king: {
        return new King(color);
      }
    }
  }

  abstract get type(): PieceType;

  abstract get moveOffsets(): MoveOffset[];

  private getType() {
    return this.type;
  }

  get name(): string {
    return typeToString.get(this.type) as string;
  }

  get imageFilePath(): string {
    return `images/piece/${colorToString.get(this.color)}_${this.name}.png`;
  }

  get cooldown(): number {
    return pieceCooldowns.get(this.type) as number;
  }

  get respawnTimer(): number {
    return pieceRespawnTimers.get(this.type) as number;
  }

  get respawnSquares(): Square[] {
    return this._respawnSquares;
  }

  abstract findLegalMoves(position: Position, currentSquare: Square): Move[];

  locateMove(position: Position, currentSquare: Square, move: Move): Move {
    if (move == null) {
      return null as any;
    }
    for (let legalMove of this.findLegalMoves(position, currentSquare)) {
      if (legalMove.row === move.row && legalMove.column === move.column) {
        return legalMove;
      }
    }
    return null as any;
  }

  abstract toString(): string;
}

abstract class UnblockablePiece extends Piece {
  abstract get moveOffsets(): MoveOffset[];

  findLegalMoves(position: Position, currentSquare: Square): Move[] {
    let legalMoves: Move[] = [];
    for (let moveOffset of this.moveOffsets) {
      let destSquare: Square = currentSquare.applyMove(moveOffset);
      if (destSquare.isOnTheBoard()) {
        let destSquareOccupier: Piece = position.pieceAt(
          destSquare.row,
          destSquare.column
        );
        if (destSquareOccupier === null) {
          legalMoves.push(new Move(destSquare.row, destSquare.column));
        } else if (this.color !== destSquareOccupier.color) {
          legalMoves.push(
            new Move(destSquare.row, destSquare.column, { isCapture: true })
          );
        }
      }
    }
    return legalMoves;
  }
}

abstract class BlockablePiece extends Piece {
  abstract get moveOffsets(): MoveOffset[];

  findLegalMoves(position: Position, currentSquare: Square): Move[] {
    let legalMoves: Move[] = [];
    for (let moveOffset of this.moveOffsets) {
      let destSquare: Square = currentSquare.applyMove(moveOffset);
      while (destSquare.isOnTheBoard()) {
        let destSquareOccupier: Piece = position.pieceAt(
          destSquare.row,
          destSquare.column
        );
        if (destSquareOccupier === null) {
          legalMoves.push(new Move(destSquare.row, destSquare.column));
          destSquare = destSquare.applyMove(moveOffset);
        } else {
          if (this.color !== destSquareOccupier.color) {
            legalMoves.push(
              new Move(destSquare.row, destSquare.column, { isCapture: true })
            );
          }
          break;
        }
      }
    }
    return legalMoves;
  }
}

export class Pawn extends Piece {
  private _startRow: number;
  private _promotionRow: number;
  private _enPassantRow: number;
  private _enPassantableRow: number;
  private _moveOffsets: MoveOffset[];
  private _captureMoveOffsets: MoveOffset[];

  constructor(color: PieceColor, startColumn: number) {
    super(color, startColumn);
    switch (color) {
      case PieceColor.white:
        this._startRow = 1;
        this._promotionRow = BOARD_SIZE - 1;
        this._enPassantRow = 4;
        this._enPassantableRow = 3;
        this._moveOffsets = [new MoveOffset(1, 0), new MoveOffset(2, 0)];
        this._captureMoveOffsets = [
          new MoveOffset(1, -1),
          new MoveOffset(1, 1),
        ];
        break;
      case PieceColor.black:
        this._startRow = BOARD_SIZE - 2;
        this._promotionRow = 0;
        this._enPassantRow = 3;
        this._enPassantableRow = 4;
        this._moveOffsets = [new MoveOffset(-1, 0), new MoveOffset(-2, 0)];
        this._captureMoveOffsets = [
          new MoveOffset(-1, -1),
          new MoveOffset(-1, 1),
        ];
        break;
    }
  }

  get startRow(): number {
    return this._startRow;
  }

  get enPassantRow(): number {
    return this._enPassantRow;
  }

  get enPassantableRow(): number {
    return this._enPassantableRow;
  }

  get type(): PieceType {
    return PieceType.pawn;
  }

  get moveOffsets(): MoveOffset[] {
    return this._moveOffsets;
  }

  get captureMoveOffsets(): MoveOffset[] {
    return this._captureMoveOffsets;
  }

  findLegalMoves(position: Position, currentSquare: Square) {
    let legalMoves: Move[] = [];
    let destSquare: Square = currentSquare.applyMove(this._moveOffsets[0]);
    if (destSquare.isOnTheBoard()) {
      let destSquareOccupier: Piece = position.pieceAt(
        destSquare.row,
        destSquare.column
      );
      if (destSquareOccupier === null) {
        legalMoves.push(
          new Move(destSquare.row, destSquare.column, {
            isPromotion: destSquare.row === this._promotionRow,
          })
        );
        if (currentSquare.row === this._startRow) {
          destSquare = currentSquare.applyMove(this._moveOffsets[1]);
          if (destSquare.isOnTheBoard()) {
            destSquareOccupier = position.pieceAt(
              destSquare.row,
              destSquare.column
            );
            if (destSquareOccupier === null) {
              legalMoves.push(new Move(destSquare.row, destSquare.column));
            }
          }
        }
      }
    }
    for (let i = 0; i < this._captureMoveOffsets.length; i++) {
      let destSquare: Square = currentSquare.applyMove(
        this._captureMoveOffsets[i]
      );
      if (destSquare.isOnTheBoard()) {
        let destSquareOccupier: Piece = position.pieceAt(
          destSquare.row,
          destSquare.column
        );
        let isCaptureAvailable: boolean =
          destSquareOccupier !== null &&
          this.color !== destSquareOccupier.color;
        let isEnPassantAvailable: boolean =
          currentSquare.row === this._enPassantRow &&
          position.isEnPassantAvailable(this.color, currentSquare.column, i) &&
          (destSquareOccupier === null ||
            this.color !== destSquareOccupier.color);
        if (isCaptureAvailable || isEnPassantAvailable) {
          legalMoves.push(
            new Move(destSquare.row, destSquare.column, {
              isCapture: isCaptureAvailable,
              isEnPassant: isEnPassantAvailable,
              isPromotion: destSquare.row === this._promotionRow,
            })
          );
        }
      }
    }

    return legalMoves;
  }

  toString(): string {
    return `${String.fromCharCode("A".charCodeAt(0) + this.startColumn)} Pawn`;
  }
}

export class Knight extends UnblockablePiece {
  get type(): PieceType {
    return PieceType.knight;
  }

  get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 2),
      new MoveOffset(2, 1),
      new MoveOffset(1, -2),
      new MoveOffset(-2, 1),
      new MoveOffset(-1, 2),
      new MoveOffset(2, -1),
      new MoveOffset(-1, -2),
      new MoveOffset(-2, -1),
    ];
  }

  toString(): string {
    return `${this.startColumn <= 3 ? "Queenside" : "Kingside"} Knight`;
  }
}

export class Bishop extends BlockablePiece {
  get type(): PieceType {
    return PieceType.bishop;
  }

  get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 1),
      new MoveOffset(1, -1),
      new MoveOffset(-1, 1),
      new MoveOffset(-1, -1),
    ];
  }

  toString(): string {
    return `${
      (this.color === PieceColor.white) === this.startColumn <= 3
        ? "Dark Squared"
        : "Light Squared"
    } Bishop`;
  }
}

export class Rook extends BlockablePiece {
  get type(): PieceType {
    return PieceType.rook;
  }

  get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 0),
      new MoveOffset(-1, 0),
      new MoveOffset(0, 1),
      new MoveOffset(0, -1),
    ];
  }

  toString(): string {
    return `${this.startColumn <= 3 ? "Queenside" : "Kingside"} Rook`;
  }
}

export class Queen extends BlockablePiece {
  get type(): PieceType {
    return PieceType.queen;
  }

  get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 0),
      new MoveOffset(-1, 0),
      new MoveOffset(0, 1),
      new MoveOffset(0, -1),
      new MoveOffset(1, 1),
      new MoveOffset(1, -1),
      new MoveOffset(-1, 1),
      new MoveOffset(-1, -1),
    ];
  }

  toString(): string {
    return "Queen";
  }
}

export class King extends UnblockablePiece {
  private _startRow: number;
  private _startColumn = 4;

  constructor(color: PieceColor) {
    super(color, null as any);
    switch (color) {
      case PieceColor.white:
        this._startRow = 0;
        break;
      case PieceColor.black:
        this._startRow = BOARD_SIZE - 1;
        break;
    }
  }

  get type(): PieceType {
    return PieceType.king;
  }

  get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 1),
      new MoveOffset(1, 0),
      new MoveOffset(1, -1),
      new MoveOffset(0, 1),
      new MoveOffset(0, -1),
      new MoveOffset(-1, 1),
      new MoveOffset(-1, 0),
      new MoveOffset(-1, -1),
    ];
  }

  findLegalMoves(position: Position, currentSquare: Square): Move[] {
    let legalMoves: Move[] = super.findLegalMoves(position, currentSquare);
    // castle check
    if (
      currentSquare.row === this._startRow &&
      currentSquare.column === this._startColumn
    ) {
      let canCastle: boolean = true;
      let castleCandidate: Piece = position.pieceAt(currentSquare.row, 0);
      if (
        castleCandidate != null &&
        castleCandidate.type === PieceType.rook &&
        this.color === castleCandidate.color &&
        position.isCastleAvailable(this.color, CastleSide.queenSide)
      ) {
        for (
          let checkedColumn: number = 1;
          checkedColumn < currentSquare.column;
          checkedColumn++
        ) {
          if (position.pieceAt(currentSquare.row, checkedColumn) != null) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) {
          legalMoves.push(
            new Move(currentSquare.row, currentSquare.column - 2, {
              isCastle: true,
              castleSide: CastleSide.queenSide,
            })
          );
        }
      }
      canCastle = true;
      castleCandidate = position.pieceAt(currentSquare.row, BOARD_SIZE - 1);
      if (
        castleCandidate != null &&
        castleCandidate.type === PieceType.rook &&
        this.color === castleCandidate.color &&
        position.isCastleAvailable(this.color, CastleSide.kingSide)
      ) {
        for (
          let checkedColumn: number = currentSquare.column + 1;
          checkedColumn < BOARD_SIZE - 1;
          checkedColumn++
        ) {
          if (position.pieceAt(currentSquare.row, checkedColumn) != null) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) {
          let move: Move = new Move(
            currentSquare.row,
            currentSquare.column + 2,
            {
              isCastle: true,
              castleSide: CastleSide.kingSide,
            }
          );
          legalMoves.push(move);
        }
      }
    }
    return legalMoves;
  }

  toString(): string {
    return "King";
  }
}

export interface PlayingPiece {
  piece: Piece;
  row: number;
  column: number;
}

export class Position {
  // null means dead
  private _playerLocations: Square[] = [];
  // null means empty
  private _boardArrangement: Piece[][] = [...Array(BOARD_SIZE)].map((_, i) =>
    Array(BOARD_SIZE).fill(null)
  );
  private _playerArrangement: number[][] = [...Array(BOARD_SIZE)].map((_, i) =>
    Array(BOARD_SIZE).fill(null)
  );
  private _castleRights: Map<PieceColor, Map<CastleSide, boolean>> = new Map<
    PieceColor,
    Map<CastleSide, boolean>
  >([
    [
      PieceColor.white,
      new Map<CastleSide, boolean>([
        [CastleSide.kingSide, false],
        [CastleSide.queenSide, false],
      ]),
    ],
    [
      PieceColor.black,
      new Map<CastleSide, boolean>([
        [CastleSide.kingSide, false],
        [CastleSide.queenSide, false],
      ]),
    ],
  ]);
  /*
    _enPassantRights[color][column][direction] is whether or not a pawn of color 'color' on column 'column' can 
    en passant the pawn to its left / right
  */
  private _enPassantRights: Map<PieceColor, boolean[][]> = new Map<
    PieceColor,
    boolean[][]
  >([
    [PieceColor.white, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
    [PieceColor.black, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
  ]);

  // debug
  private id: string = null as any;

  constructor(id?: string) {
    if (typeof id !== "undefined") {
      this.id = id;
    }
  }

  static get startPlayerLocations(): Square[] {
    return [...Array(BOARD_SIZE)]
      .map((_, j) => new Square(0, j))
      .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(1, j)))
      .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(6, j)))
      .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(7, j)));
  }

  private static get startBoardArrangement(): Piece[][] {
    return [...Array(BOARD_SIZE)].map((_, i) => {
      switch (i) {
        case 0: {
          return [
            new Rook(PieceColor.white, 0),
            new Knight(PieceColor.white, 1),
            new Bishop(PieceColor.white, 2),
            new Queen(PieceColor.white, 3),
            new King(PieceColor.white),
            new Bishop(PieceColor.white, 5),
            new Knight(PieceColor.white, 6),
            new Rook(PieceColor.white, 7),
          ];
        }
        case 1: {
          return [...Array(BOARD_SIZE)].map(
            (_, j) => new Pawn(PieceColor.white, j)
          );
        }
        case 6: {
          return [...Array(BOARD_SIZE)].map(
            (_, j) => new Pawn(PieceColor.black, j)
          );
        }
        case 7: {
          return [
            new Rook(PieceColor.black, 0),
            new Knight(PieceColor.black, 1),
            new Bishop(PieceColor.black, 2),
            new Queen(PieceColor.black, 3),
            new King(PieceColor.black),
            new Bishop(PieceColor.black, 5),
            new Knight(PieceColor.black, 6),
            new Rook(PieceColor.black, 7),
          ];
        }
        default: {
          return Array(BOARD_SIZE).fill(null as any);
        }
      }
    });
  }

  private static get startPlayerArrangement(): number[][] {
    return [...Array(BOARD_SIZE)].map((_, i) => {
      switch (i) {
        case 0: {
          return [...Array(BOARD_SIZE)].map((_, j) => j);
        }
        case 1: {
          return [...Array(BOARD_SIZE)].map((_, j) => j + BOARD_SIZE);
        }
        case 6: {
          return [...Array(BOARD_SIZE)].map((_, j) => j + 2 * BOARD_SIZE);
        }
        case 7: {
          return [...Array(BOARD_SIZE)].map((_, j) => j + 3 * BOARD_SIZE);
        }
        default: {
          return Array(BOARD_SIZE).fill(null);
        }
      }
    });
  }

  private static get startCastleRights(): Map<
    PieceColor,
    Map<CastleSide, boolean>
  > {
    return new Map<PieceColor, Map<CastleSide, boolean>>([
      [
        PieceColor.white,
        new Map<CastleSide, boolean>([
          [CastleSide.kingSide, true],
          [CastleSide.queenSide, true],
        ]),
      ],
      [
        PieceColor.black,
        new Map<CastleSide, boolean>([
          [CastleSide.kingSide, true],
          [CastleSide.queenSide, true],
        ]),
      ],
    ]);
  }

  private static get startEnPassantRights(): Map<PieceColor, boolean[][]> {
    return new Map<PieceColor, boolean[][]>([
      [PieceColor.white, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
      [PieceColor.black, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
    ]);
  }

  static getStartSquareByPlayer(playerIndex: number): Square {
    return Position.startPlayerLocations[playerIndex];
  }

  static getStartPieceByPlayer(playerIndex: number): Piece {
    let startSquare = Position.startPlayerLocations[playerIndex];
    if (startSquare == undefined) {
      console.log(playerIndex);
    }
    return Position.startBoardArrangement[startSquare.row][startSquare.column];
  }

  static getPlayerIndicesByPieceType(type: PieceType): number[] {
    switch (type) {
      case PieceType.pawn: {
        return [...Array(BOARD_SIZE * 2)].map((_, i: number) => i + BOARD_SIZE);
      }
      case PieceType.knight: {
        return [1, 6, 25, 30];
      }
      case PieceType.bishop: {
        return [2, 5, 26, 29];
      }
      case PieceType.rook: {
        return [0, 7, 24, 31];
      }
      case PieceType.queen: {
        return [3, 27];
      }
      case PieceType.king: {
        return [4, 28];
      }
    }
  }

  static getPlayerIndicesByColor(color: PieceColor): number[] {
    switch (color) {
      case PieceColor.white: {
        return [...Array(NUM_OF_PLAYERS / 2)].map((_, i: number) => i);
      }
      case PieceColor.black: {
        return [...Array(NUM_OF_PLAYERS / 2)].map(
          (_, i: number) => i + NUM_OF_PLAYERS / 2
        );
      }
    }
  }

  static getStartPlayingPieces(): PlayingPiece[] {
    return [...Array(NUM_OF_PLAYERS)].map((i) => {
      return {
        piece: Position.getStartPieceByPlayer(i),
        row: Position.startPlayerLocations[i].row,
        column: Position.startPlayerLocations[i].column,
      };
    });
  }

  static getColorByPlayer(playerIndex: number): PieceColor {
    return playerIndex < NUM_OF_PLAYERS / 2
      ? PieceColor.white
      : PieceColor.black;
  }

  get playerLocations(): Square[] {
    return [...this._playerLocations];
  }

  get playingPieces(): PlayingPiece[] {
    return this.playerLocations.map((square: Square): PlayingPiece => {
      if (square == null) {
        return { piece: null as any, row: null as any, column: null as any };
      }
      return {
        piece: this.pieceAt(square.row, square.column),
        row: square.row,
        column: square.column,
      };
    });
  }

  setToStartingPosition() {
    this._playerLocations = Position.startPlayerLocations;
    this._boardArrangement = Position.startBoardArrangement;
    this._playerArrangement = Position.startPlayerArrangement;
    this._castleRights = Position.startCastleRights;
    this._enPassantRights = Position.startEnPassantRights;
  }

  getPieceByPlayer(playerIndex: number): Piece {
    let playerSquare: Square = this._playerLocations[playerIndex];
    if (playerSquare === null) {
      return null as any;
    }
    return this._boardArrangement[playerSquare.row][playerSquare.column];
  }

  pieceAt(row: number, column: number): Piece {
    return this._boardArrangement[row][column];
  }

  playerAt(row: number, column: number): number {
    return this._playerArrangement[row][column];
  }

  getPlayerLocation(playerIndex: number): Square {
    return this._playerLocations[playerIndex];
  }

  isCastleAvailable(color: PieceColor, castleSide: CastleSide): boolean {
    return this._castleRights.get(color)?.get(castleSide) as boolean;
  }

  isEnPassantAvailable(
    color: PieceColor,
    column: number,
    direction: number
  ): boolean {
    return this._enPassantRights.get(color)![column][direction];
  }

  findAvaillableMovesForPlayer(playerIndex: number): Move[] {
    let square: Square = this.getPlayerLocation(playerIndex);
    if (square != null) {
      return this.pieceAt(square.row, square.column).findLegalMoves(
        this,
        square
      );
    }
    return [];
  }

  locateMoveForPlayer(playerIndex: number, move: Move): Move {
    let square: Square = this._playerLocations[playerIndex];
    if (square != null) {
      return this._boardArrangement[square.row][square.column].locateMove(
        this,
        square,
        move
      );
    }
    return null as any;
  }

  private _updateCastleRights(changeRow: number, changeColumn: number) {
    if (changeRow === 0) {
      if (changeColumn === 0) {
        this._castleRights
          .get(PieceColor.white)
          ?.set(CastleSide.queenSide, false);
      } else if (changeColumn === 4) {
        this._castleRights
          .get(PieceColor.white)
          ?.set(CastleSide.queenSide, false);
        this._castleRights
          .get(PieceColor.white)
          ?.set(CastleSide.kingSide, false);
      } else if (changeColumn === 7) {
        this._castleRights
          .get(PieceColor.white)
          ?.set(CastleSide.kingSide, false);
      }
    } else if (changeRow === 7) {
      if (changeColumn === 0) {
        this._castleRights
          .get(PieceColor.black)
          ?.set(CastleSide.queenSide, false);
      } else if (changeColumn === 4) {
        this._castleRights
          .get(PieceColor.black)
          ?.set(CastleSide.queenSide, false);
        this._castleRights
          .get(PieceColor.black)
          ?.set(CastleSide.kingSide, false);
      } else if (changeColumn === 7) {
        this._castleRights
          .get(PieceColor.black)
          ?.set(CastleSide.kingSide, false);
      }
    }
  }

  private _setEnPassantRightsForColorAgainstColumn(
    color: PieceColor,
    column: number,
    state: boolean
  ) {
    switch (column) {
      case 0:
        this._enPassantRights.get(color)![1][0] = state;
        break;
      case BOARD_SIZE - 1:
        this._enPassantRights.get(color)![BOARD_SIZE - 2][1] = state;
        break;
      default:
        this._enPassantRights.get(color)![column + 1][0] = state;
        this._enPassantRights.get(color)![column - 1][1] = state;
        break;
    }
  }

  isPlayerAlive(playerIndex: number) {
    return this.playerLocations[playerIndex] != null;
  }

  isSquareUnderThreat(
    row: number,
    column: number,
    threateningColor: PieceColor
  ): boolean {
    for (let type of [PieceType.bishop, PieceType.rook, PieceType.queen]) {
      let moveOffsets: MoveOffset[] = Piece.generate(
        type,
        PieceColor.white
      ).moveOffsets;
      for (let moveOffset of moveOffsets) {
        let checkedSquare: Square = new Square(row, column);
        while (true) {
          checkedSquare = checkedSquare.applyMove(moveOffset);
          if (!checkedSquare.isOnTheBoard()) {
            break;
          }
          let checkedPiece: Piece = this.pieceAt(
            checkedSquare.row,
            checkedSquare.column
          );
          if (checkedPiece !== null) {
            if (
              checkedPiece.color === threateningColor &&
              checkedPiece.type === type
            ) {
              return true;
            } else {
              break;
            }
          }
        }
      }
    }
    for (let type of [PieceType.knight, PieceType.king]) {
      let moveOffsets: MoveOffset[] = Piece.generate(
        type,
        PieceColor.white
      ).moveOffsets;
      for (let moveOffset of moveOffsets) {
        let checkedSquare: Square = new Square(row, column);
        checkedSquare = checkedSquare.applyMove(moveOffset);
        if (checkedSquare.isOnTheBoard()) {
          let checkedPiece: Piece = this.pieceAt(
            checkedSquare.row,
            checkedSquare.column
          );
          if (
            checkedPiece !== null &&
            checkedPiece.color === threateningColor &&
            checkedPiece.type === type
          ) {
            return true;
          }
        }
      }
    }
    for (let moveOffset of new Pawn(reverseColor(threateningColor), 0)
      .captureMoveOffsets) {
      let checkedSquare: Square = new Square(row, column);
      checkedSquare = checkedSquare.applyMove(moveOffset);
      if (checkedSquare.isOnTheBoard()) {
        let checkedPiece: Piece = this.pieceAt(
          checkedSquare.row,
          checkedSquare.column
        );
        if (
          checkedPiece !== null &&
          checkedPiece.color === threateningColor &&
          checkedPiece.type === PieceType.pawn
        ) {
          return true;
        }
      }
    }
    return false;
  }

  isPlayerUnderThreat(playerIndex: number): boolean {
    let playerSquare: Square = this.getPlayerLocation(playerIndex);
    return playerSquare === null
      ? false
      : this.isSquareUnderThreat(
          playerSquare.row,
          playerSquare.column,
          reverseColor(Position.getColorByPlayer(playerIndex))
        );
  }

  // debug: returns false if there was an error
  move(playerIndex: number, row: number, column: number): boolean {
    let startSquare: Square = this._playerLocations[playerIndex];
    if (startSquare != null) {
      let startRow: number = startSquare.row;
      let startColumn: number = startSquare.column;
      if (row === startRow && column === startColumn) {
        return true;
      }
      this.killPlayerAt(row, column);
      this._boardArrangement[row][column] =
        this._boardArrangement[startRow][startColumn];
      this._boardArrangement[startRow][startColumn] = null as any;
      this._playerArrangement[row][column] =
        this._playerArrangement[startRow][startColumn];
      this._playerArrangement[startRow][startColumn] = null as any;
      this._playerLocations[playerIndex] = new Square(row, column);
      this._updateCastleRights(startRow, startColumn);
      // update en passant rights
      let movingPiece: Piece = this._boardArrangement[row][column] as Piece;
      if (movingPiece.type === PieceType.pawn) {
        if (
          startRow === (movingPiece as Pawn).startRow &&
          row === (movingPiece as Pawn).enPassantableRow
        ) {
          this._setEnPassantRightsForColorAgainstColumn(
            reverseColor(movingPiece.color),
            column,
            true
          );
        } else if (startRow === (movingPiece as Pawn).enPassantableRow) {
          this._setEnPassantRightsForColorAgainstColumn(
            reverseColor(movingPiece.color),
            column,
            false
          );
        }
        if (row === (movingPiece as Pawn).enPassantRow) {
          this._enPassantRights.get(movingPiece.color)![column] = [
            false,
            false,
          ];
        }
      }
    }
    return true;
  }

  moveFrom(
    startRow: number,
    startColumn: number,
    destRow: number,
    destColumn: number
  ) {
    let playerIndex: number = this._playerArrangement[startRow][startColumn];
    if (playerIndex != null) {
      this.move(playerIndex, destRow, destColumn);
    }
  }

  killPlayer(playerIndex: number) {
    let playerSquare: Square = this._playerLocations[playerIndex];
    if (playerSquare != null) {
      this.killPlayerAt(playerSquare.row, playerSquare.column);
    }
  }

  killPlayerAt(row: number, column: number) {
    // update en passant rights
    let dyingPiece: Piece = this._boardArrangement[row][column];
    if (
      dyingPiece != null &&
      dyingPiece.type === PieceType.pawn &&
      row === (dyingPiece as Pawn).enPassantableRow
    ) {
      this._setEnPassantRightsForColorAgainstColumn(
        reverseColor(dyingPiece.color),
        column,
        false
      );
    }
    this._boardArrangement[row][column] = null as any;
    let playerIndex: number = this._playerArrangement[row][column];
    if (playerIndex != null) {
      this._playerLocations[playerIndex] = null as any;
    }
    this._playerArrangement[row][column] = null as any;
    this._updateCastleRights(row, column);
  }

  promotePieceAt(row: number, column: number, promotionType: PieceType) {
    this._boardArrangement[row][column] = Piece.generate(
      promotionType,
      this._boardArrangement[row][column]!.color
    );
  }

  getRespawnSquareForPlayer(playerIndex: number): Square {
    for (let respawnSquare of Position.getStartPieceByPlayer(playerIndex)
      .respawnSquares) {
      if (
        this._boardArrangement[respawnSquare.row][respawnSquare.column] == null
      ) {
        return respawnSquare;
      }
    }
    return null as any;
  }

  respawnPlayerAt(playerIndex: number, respawnSquare: Square) {
    if (respawnSquare != null) {
      this._playerLocations[playerIndex] = respawnSquare;
      this._boardArrangement[respawnSquare.row][respawnSquare.column] =
        Position.getStartPieceByPlayer(playerIndex);
      this._playerArrangement[respawnSquare.row][respawnSquare.column] =
        playerIndex;
    }
  }
}
