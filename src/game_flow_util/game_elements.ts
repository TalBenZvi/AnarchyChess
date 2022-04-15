import { replacer } from "./communication";

export const BOARD_SIZE = 8;

export const NUM_OF_PLAYERS = 32;

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

class MoveOffset {
  constructor(public rowOffset: number, public columnOffset: number) {}
}

export class Square {
  constructor(readonly row: number, readonly column: number) {}

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

  toJson(): string {
    return JSON.stringify(this, (key, value) => {
      if (
        [
          "isPromotion",
          "isCapture",
          "isEnPassant",
          "isCastle",
          "castleSide",
        ].indexOf(key) > -1
      ) {
        return undefined;
      }
      return value;
    });
  }
}

export abstract class Piece {
  constructor(public color: PieceColor) {}

  static generate(type: PieceType, color: PieceColor) {
    switch (type) {
      case PieceType.pawn: {
        return new Pawn(color);
      }
      case PieceType.knight: {
        return new Knight(color);
      }
      case PieceType.bishop: {
        return new Bishop(color);
      }
      case PieceType.rook: {
        return new Rook(color);
      }
      case PieceType.queen: {
        return new Queen(color);
      }
      case PieceType.king: {
        return new King(color);
      }
    }
  }

  abstract get type(): PieceType;

  get name(): string {
    return typeToString.get(this.type) as string;
  }

  get imageFilePath(): string {
    return `images/piece/${colorToString.get(this.color)}_${this.name}.png`;
  }

  abstract findLegalMoves(position: Position, currentSquare: Square): Move[];

  locateMove(position: Position, currentSquare: Square, move: Move): Move {
    for (let legalMove of this.findLegalMoves(position, currentSquare)) {
      if (legalMove.row === move.row && legalMove.column === move.column) {
        return legalMove;
      }
    }
    return null as any;
  }
}

abstract class UnblockablePiece extends Piece {
  protected abstract get moveOffsets(): MoveOffset[];

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
  protected abstract get moveOffsets(): MoveOffset[];

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

  constructor(color: PieceColor) {
    super(color);
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
}

export class Knight extends UnblockablePiece {
  get type(): PieceType {
    return PieceType.knight;
  }

  protected get moveOffsets(): MoveOffset[] {
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
}

export class Bishop extends BlockablePiece {
  get type(): PieceType {
    return PieceType.bishop;
  }

  protected get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 1),
      new MoveOffset(1, -1),
      new MoveOffset(-1, 1),
      new MoveOffset(-1, -1),
    ];
  }
}

export class Rook extends BlockablePiece {
  get type(): PieceType {
    return PieceType.rook;
  }

  protected get moveOffsets(): MoveOffset[] {
    return [
      new MoveOffset(1, 0),
      new MoveOffset(-1, 0),
      new MoveOffset(0, 1),
      new MoveOffset(0, -1),
    ];
  }
}

export class Queen extends BlockablePiece {
  get type(): PieceType {
    return PieceType.queen;
  }

  protected get moveOffsets(): MoveOffset[] {
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
}

export class King extends UnblockablePiece {
  private _startRow: number;
  private _startColumn = 4;

  constructor(color: PieceColor) {
    super(color);
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

  protected get moveOffsets(): MoveOffset[] {
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
          let move: Move = new Move(currentSquare.row, currentSquare.column + 2, {
            isCastle: true,
            castleSide: CastleSide.kingSide,
          });
          legalMoves.push(
            move
          );
          console.log(`(king) ${move.castleSide}`);
        }
      }
    }
    return legalMoves;
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
    this._playerLocations = [...Array(BOARD_SIZE)]
      .map((_, j) => new Square(0, j))
      .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(1, j)))
      .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(6, j)))
      .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(7, j)));
    this._boardArrangement = [...Array(BOARD_SIZE)].map((_, i) => {
      switch (i) {
        case 0: {
          return [
            new Rook(PieceColor.white),
            new Knight(PieceColor.white),
            new Bishop(PieceColor.white),
            new Queen(PieceColor.white),
            new King(PieceColor.white),
            new Bishop(PieceColor.white),
            new Knight(PieceColor.white),
            new Rook(PieceColor.white),
          ];
        }
        case 1: {
          return [...Array(BOARD_SIZE)].map(
            (_, j) => new Pawn(PieceColor.white)
          );
        }
        case 6: {
          return [...Array(BOARD_SIZE)].map(
            (_, j) => new Pawn(PieceColor.black)
          );
        }
        case 7: {
          return [
            new Rook(PieceColor.black),
            new Knight(PieceColor.black),
            new Bishop(PieceColor.black),
            new Queen(PieceColor.black),
            new King(PieceColor.black),
            new Bishop(PieceColor.black),
            new Knight(PieceColor.black),
            new Rook(PieceColor.black),
          ];
        }
        default: {
          return Array(BOARD_SIZE).fill(null as any);
        }
      }
    });

    this._playerArrangement = [...Array(BOARD_SIZE)].map((_, i) => {
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

    this._castleRights = new Map<PieceColor, Map<CastleSide, boolean>>([
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
    this._enPassantRights = new Map<PieceColor, boolean[][]>([
      [PieceColor.white, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
      [PieceColor.black, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
    ]);
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
    let square: Square = this.getPlayerLocation(playerIndex);
    if (square != null) {
      return this.pieceAt(square.row, square.column).locateMove(
        this,
        square,
        move
      );
    }
    return null as any;
  }

  _updateCastleRights(changeRow: number, changeColumn: number) {
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

  _setEnPassantRightsForColorAgainstColumn(
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

  move(playerIndex: number, row: number, column: number) {
    let startSquare: Square = this._playerLocations[playerIndex];
    if (startSquare != null) {
      let startRow: number = startSquare.row;
      let startColumn: number = startSquare.column;
      if (row === startRow && column === startColumn) {
        return;
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
}

export interface Board {
  setPlayerIndex(playerIndex: number): void;

  setPieces(
    playingPieces: PlayingPiece[],
    availableMoves: Move[],
    movingPieceIndex: number,
    cooldownTimer: number,
    remainingCooldown: number,
  ): void;
}

/*
// interface
class GraveYard {
  void addPiece(Piece piece, double respawnTimer) {}

  set povColor(PieceColor color) {}

  void clear() {}
}

// interface
class MoveList {
  void addMove(Move move, int startRow, int startColumn, Position position) {}

  void clear() {}
}
*/
