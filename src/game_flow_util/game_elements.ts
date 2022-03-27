const BOARD_SIZE = 8;

const NUM_OF_PLAYERS = 32;

enum PieceType {
  pawn,
  knight,
  bishop,
  rook,
  queen,
  king,
}

const typeToString = new Map<PieceType, string>([
    [PieceType.pawn, "pawn"], 
    [PieceType.knight, "knight"],
    [PieceType.bishop, "bishop"],
    [PieceType.rook, "rook"],
    [PieceType.queen, "queen"],
    [PieceType.king, "king"],
]);

enum PieceColor {
    white,
    black,
}

const colorToString = new Map<PieceColor, string>([
    [PieceColor.white, "white"], 
    [PieceColor.black, "black"],
]);
  
const reverseColor = (color: PieceColor) => <PieceColor>(color == PieceColor.white ? PieceColor.black : PieceColor.white);

class MoveOffset {
  constructor(public rowOffset: number, public columnOffset: number) {}
}

class Square {
    constructor(readonly row:number, readonly column: number) {}

    isOnTheBoard = () => <boolean>(0 <= this.row && this.row < BOARD_SIZE && 0 <= this.column && this.column < BOARD_SIZE);

    applyMove = (moveOffset: MoveOffset) => new Square(this.row + moveOffset.rowOffset, this.column + moveOffset.columnOffset);
}

enum CastleSide {
  kingSide,
  queenSide,
}

interface OptionalMoveParams {
    isPromotion?: boolean,
    promotionType?: PieceType,
    isCapture?: boolean,
    isEnPassant?: boolean,
    isCastle?: boolean,
    castleSide?: CastleSide,
}

class Move {
    isPromotion: boolean = false;
    promotionType: PieceType = null as any;
    isCapture: boolean  = false;
    isEnPassant: boolean  = false;
    isCastle: boolean  = false;
    castleSide: CastleSide = null as any;

    constructor(public row: number, public column: number, params?: OptionalMoveParams) {
        if (params != null) {
            this.isPromotion = Boolean(params.isPromotion);
            this.promotionType = (Boolean(params.promotionType) ? params.promotionType : null) as PieceType;
            this.isCapture = Boolean(params.isCapture);
            this.isEnPassant = Boolean(params.isEnPassant);
            this.isCastle = Boolean(params.isCastle);
            this.castleSide = (Boolean(params.castleSide) ? params.castleSide : null) as CastleSide;
        }
    }
}



abstract class Piece {
  constructor(public color: PieceColor) {}

  static generate(type: PieceType, color:PieceColor) {
    switch(type) {
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
    return <string>typeToString.get(this.type);
  }     

    get imageFilePath(): string  {
        return `images/pieces/${colorToString.get(this.color)}_${name}.png`;
    }

  abstract findLegalMoves(position: Position, currentSquare:Square): Move[];

  getMove(position: Position, currentSquare:Square, row: number, column: number): Move | null {
    for (let move of this.findLegalMoves(position, currentSquare)) {
      if (move.row == row && move.column == column) {
        return move;
      }
    }
    return null;
  }
}

abstract class UnblockablePiece extends Piece {
  protected abstract get moveOffsets(): MoveOffset[];

  findLegalMoves(position: Position, currentSquare: Square): Move[] {
    let legalMoves: Move[] = [];
    for (let moveOffset of this.moveOffsets) {
      let destSquare: Square = currentSquare.applyMove(moveOffset);
      if (destSquare.isOnTheBoard()) {
        let destSquareOccupier: Piece = position.pieceAt(destSquare.row, destSquare.column);
        if (destSquareOccupier == null) {
          legalMoves.push(new Move(destSquare.row, destSquare.column));
        } else if (this.color != destSquareOccupier.color) {
          legalMoves.push(new Move(destSquare.row, destSquare.column, {isCapture: true}));
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
          let destSquareOccupier: Piece = position.pieceAt(destSquare.row, destSquare.column);
          if (destSquareOccupier == null) {
            legalMoves.push(new Move(destSquare.row, destSquare.column));
            destSquare = destSquare.applyMove(moveOffset);
          } else {
            if (this.color != destSquareOccupier.color) {
                legalMoves.push(new Move(destSquare.row, destSquare.column, {isCapture: true}));
            }
            break;
          }
        }
      }
    return legalMoves;
  }
}

class Pawn extends Piece {
  private _startRow: number;
  private _promotionRow: number;
  private _enPassantRow: number;
  private _enPassantableRow: number;
  private _moveOffsets: MoveOffset[];
  private _captureMoveOffsets: MoveOffset[];

  constructor(color: PieceColor) {
      super(color);
    switch(color) {
      case PieceColor.white: {
        this._startRow = 1;
        this._promotionRow = BOARD_SIZE - 1;
        this._enPassantRow = 4;
        this._enPassantableRow = 3;
        this._moveOffsets = [new MoveOffset(1, 0), new MoveOffset(2, 0)];
        this._captureMoveOffsets = [new MoveOffset(1, -1), new MoveOffset(1, 1)];
      }
      break;
      case PieceColor.black: {
        this._startRow = BOARD_SIZE - 2;
        this._promotionRow = 0;
        this._enPassantRow = 3;
        this._enPassantableRow = 4;
        this._moveOffsets = [new MoveOffset(-1, 0), new MoveOffset(-2, 0)];
        this._captureMoveOffsets = [new MoveOffset(-1, -1), new MoveOffset(-1, 1)];
      }
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
      let destSquareOccupier: Piece = position.pieceAt(destSquare.row, destSquare.column);
      if (destSquareOccupier == null) {
        legalMoves.push(new Move(destSquare.row, destSquare.column, {isPromotion: destSquare.row == this._promotionRow}));
        if (currentSquare.row == this._startRow) {
          destSquare = currentSquare.applyMove(this._moveOffsets[1]);
          if (destSquare.isOnTheBoard()) {
            destSquareOccupier = position.pieceAt(destSquare.row, destSquare.column);
            if (destSquareOccupier == null) {
              legalMoves.push(new Move(destSquare.row, destSquare.column));
            }
          }
        }
      }
    }
    for (let i = 0; i < this._captureMoveOffsets.length; i++) {
      let destSquare: Square = currentSquare.applyMove(this._captureMoveOffsets[i]);
      if (destSquare.isOnTheBoard()) {
        let destSquareOccupier: Piece = position.pieceAt(destSquare.row, destSquare.column);
        let isCaptureAvailable: boolean = destSquareOccupier != null && this.color != destSquareOccupier.color;
        let isEnPassantAvailable: boolean = position.isEnPassantAvailable(this.color, currentSquare.column, i) && 
                                    (destSquareOccupier == null || this.color != destSquareOccupier.color);
        if (isCaptureAvailable || isEnPassantAvailable) {
          legalMoves.push(new Move(destSquare.row, destSquare.column, {isCapture: isCaptureAvailable, 
                              isEnPassant: isEnPassantAvailable, isPromotion: destSquare.row == this._promotionRow}));
        }
      }
    }

    return legalMoves;
  }
}

class Knight extends UnblockablePiece {
  get type(): PieceType {
    return PieceType.knight;
  } 

  protected get moveOffsets(): MoveOffset[] {
    return [new MoveOffset(1, 2), new MoveOffset(2, 1), new MoveOffset(1, -2), new MoveOffset(-2, 1),
            new MoveOffset(-1, 2), new MoveOffset(2, -1), new MoveOffset(-1, -2), new MoveOffset(-2, -1)];
  }
}

class Bishop extends BlockablePiece {
  get type(): PieceType {
    return PieceType.bishop;
  } 

  protected get moveOffsets(): MoveOffset[] {
    return [new MoveOffset(1, 1), new MoveOffset(1, -1), new MoveOffset(-1, 1), new MoveOffset(-1, -1)];
  }
}

class Rook extends BlockablePiece {
  get type(): PieceType {
    return PieceType.rook;
  } 

  protected get moveOffsets(): MoveOffset[] {
    return [new MoveOffset(1, 0), new MoveOffset(-1, 0), new MoveOffset(0, 1), new MoveOffset(0, -1)];
  }
}

class Queen extends BlockablePiece {
  get type(): PieceType {
    return PieceType.queen;
  } 

  protected get moveOffsets(): MoveOffset[] {
    return [new MoveOffset(1, 0), new MoveOffset(-1, 0), new MoveOffset(0, 1), new MoveOffset(0, -1),
            new MoveOffset(1, 1), new MoveOffset(1, -1), new MoveOffset(-1, 1), new MoveOffset(-1, -1)];
  }
}

class King extends UnblockablePiece {
  private _startRow: number;
  private _startColumn = 4;

  constructor(color: PieceColor) {
    super(color);
    switch(color) {
      case PieceColor.white: {
        this._startRow = 0;
      }
      break;
      case PieceColor.black: {
        this._startRow = BOARD_SIZE - 1;
      }
      break;
    }
  }

  get type(): PieceType {
    return PieceType.king;
  } 

  protected get moveOffsets(): MoveOffset[] {
    return [new MoveOffset(1, 1), new MoveOffset(1, 0), new MoveOffset(1, -1), 
            new MoveOffset(0, 1),                        new MoveOffset(0, -1), 
            new MoveOffset(-1, 1), new MoveOffset(-1, 0), new MoveOffset(-1, -1)];
  }

  findLegalMoves(position: Position, currentSquare: Square): Move[] {
    let legalMoves: Move[] = super.findLegalMoves(position, currentSquare);
    // castle check
    if (currentSquare.row == this._startRow && currentSquare.column == this.startColumn) {
      let canCastle: boolean = true;
      let castleCandidate: Piece = position.pieceAt(currentSquare.row, 0);
      if (castleCandidate != null && castleCandidate.type == PieceType.rook && this.color == castleCandidate.color 
          && position.isCastleAvailable(this.color, CastleSide.queenSide)) {
        for (let checkedColumn: number = 1; checkedColumn < currentSquare.column; checkedColumn++) {
          if (position.pieceAt(currentSquare.row, checkedColumn) != null) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) {
          legalMoves.push(new Move(currentSquare.row, currentSquare.column - 2, {isCastle: true, castleSide: CastleSide.queenSide}));
        }
      }
      canCastle = true;
      castleCandidate = position.pieceAt(currentSquare.row, BOARD_SIZE - 1);
      if (castleCandidate != null && castleCandidate.type == PieceType.rook && this.color == castleCandidate.color 
        && position.isCastleAvailable(this.color, CastleSide.kingSide)) {
        for (let checkedColumn: number = currentSquare.column + 1; checkedColumn < BOARD_SIZE - 1; checkedColumn++) {
          if (position.pieceAt(currentSquare.row, checkedColumn) != null) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) {
          legalMoves.push(new Move(currentSquare.row, currentSquare.column + 2, {isCastle: true, castleSide: CastleSide.kingSide}));
        }
      }
    }
    return legalMoves;
  }
}



class Position {
  // null means dead
  private _playerLocations: Square[] = [];
  // null means empty
  private _boardArrangement: Piece[][] = [...Array(BOARD_SIZE)].map((_, i) => Array(BOARD_SIZE).fill(null));
  private _playerArrangement: number[][] = [...Array(BOARD_SIZE)].map((_, i) => Array(BOARD_SIZE).fill(null));
  private _castleRights: Map<PieceColor, Map<CastleSide, boolean>> = new Map<PieceColor, Map<CastleSide, boolean>>([
    [PieceColor.white, new Map<CastleSide, boolean>([
      [CastleSide.kingSide, false],
      [CastleSide.queenSide, false],
    ])],
    [PieceColor.black, new Map<CastleSide, boolean>([
      [CastleSide.kingSide, false],
      [CastleSide.queenSide, false],
    ])],
  ]);
  /*
    _enPassantRights[color][column][direction] is whether or not a pawn of color 'color' on column 'column' can 
    en passant the pawn to its left / right
  */
  private _enPassantRights: Map<PieceColor, boolean[][]> = new Map<PieceColor, boolean[][]>([
    [PieceColor.white, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
    [PieceColor.black, [...Array(BOARD_SIZE)].map((_, i) => [false, false])],
  ]);

  get playerLocations(): Square[] {
    return [...this._playerLocations];
  } 

  setToStartingPosition() {
    this._playerLocations = [...Array(BOARD_SIZE)].map((_, j) => new Square(0, j))
    .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(1, j)))
    .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(6, j)))
    .concat([...Array(BOARD_SIZE)].map((_, j) => new Square(7, j)));
    _boardArrangement = List.generate(BOARD_SIZE, (i) {
      switch(i) {
        case 0: {
          return [Rook(PieceColor.white), Knight(PieceColor.white), Bishop(PieceColor.white), Queen(PieceColor.white),
                  King(PieceColor.white), Bishop(PieceColor.white), Knight(PieceColor.white), Rook(PieceColor.white)];
        }
        case 1: {
          return List.generate(BOARD_SIZE, (j) => Pawn(PieceColor.white));
        }
        case 6: {
          return List.generate(BOARD_SIZE, (j) => Pawn(PieceColor.black));
        }
        case 7: {
          return [Rook(PieceColor.black), Knight(PieceColor.black), Bishop(PieceColor.black), Queen(PieceColor.black),
                  King(PieceColor.black), Bishop(PieceColor.black), Knight(PieceColor.black), Rook(PieceColor.black)];
        }
        default: {
          return List.filled(BOARD_SIZE, null);
        }
      }
    });
    _playerArrangement = List.generate(BOARD_SIZE, (i) {
      switch(i) {
        case 0: {
          return List.generate(BOARD_SIZE, (j) => j);
        }
        case 1: {
          return List.generate(BOARD_SIZE, (j) => j + BOARD_SIZE);
        }
        case 6: {
          return List.generate(BOARD_SIZE, (j) => j + 2 * BOARD_SIZE);
        }
        case 7: {
          return List.generate(BOARD_SIZE, (j) => j + 3 * BOARD_SIZE);
        }
        default: {
          return List.filled(BOARD_SIZE, null);
        }
      }
    });
    _castleRights = {PieceColor.white: {CastleSide.kingSide: true, CastleSide.queenSide: true},
                     PieceColor.black: {CastleSide.kingSide: true, CastleSide.queenSide: true}};
    _enPassantRights = {PieceColor.white: List.generate(BOARD_SIZE, (i) => [false, false]),
                                                        PieceColor.black: List.generate(BOARD_SIZE, (i) => [false, false])};
  }


  Piece? getPieceByPlayer(int playerIndex) {
    Square? playerSquare = _playerLocations[playerIndex];
    if (playerSquare == null) {
      return null;
    }
    return _boardArrangement[playerSquare.row][playerSquare.column];
  }

  Piece? pieceAt(int row, int column) => _boardArrangement[row][column];

  int? playerAt(int row, int column) => _playerArrangement[row][column];

  Square? getPlayerLocation(int playerIndex) => _playerLocations[playerIndex];

  bool isCastleAvailable(PieceColor color, CastleSide castleSide) => _castleRights[color]![castleSide] as bool;

  bool isEnPassantAvailable(PieceColor color, int column, int direction) => _enPassantRights[color]![column][direction];

  void _updateCastleRights(changeRow, changeColumn) {
    if (changeRow == 0) {
        if (changeColumn == 0) {
          _castleRights[PieceColor.white]![CastleSide.queenSide] = false;
        } else if (changeColumn == 4) {
          _castleRights[PieceColor.white]![CastleSide.queenSide] = false;
          _castleRights[PieceColor.white]![CastleSide.kingSide] = false;
        } else if (changeColumn == 7) {
          _castleRights[PieceColor.white]![CastleSide.kingSide] = false;
        } 
      } else if (changeRow == 7) {
        if (changeColumn == 0) {
          _castleRights[PieceColor.black]![CastleSide.queenSide] = false;
        } else if (changeColumn == 4) {
          _castleRights[PieceColor.black]![CastleSide.queenSide] = false;
          _castleRights[PieceColor.black]![CastleSide.kingSide] = false;
        } else if (changeColumn == 7) {
          _castleRights[PieceColor.black]![CastleSide.kingSide] = false;
        } 
      }
  }

  void _setEnPassantRightsForColorAgainstColumn(PieceColor color, int column, bool state) {
    switch (column) {
      case 0: {
        _enPassantRights[color]![1][0] = state;
      }
      break;
      case BOARD_SIZE - 1: {
        _enPassantRights[color]![BOARD_SIZE - 2][1] = state;
      }
      break;
      default: {
        _enPassantRights[color]![column + 1][0] = state;
        _enPassantRights[color]![column - 1][1] = state;
      }
      break;
    }
  }

  void move(int playerIndex, int row, int column) {
    Square? startSquare = _playerLocations[playerIndex];
    if (startSquare != null) {
      int startRow = startSquare.row;
      int startColumn = startSquare.column;
      _boardArrangement[row][column] = _boardArrangement[startRow][startColumn];
      _boardArrangement[startRow][startColumn] = null;
      _playerArrangement[row][column] = _playerArrangement[startRow][startColumn];
      _playerArrangement[startRow][startColumn] = null;
      _playerLocations[playerIndex] = Square(row, column);
      _updateCastleRights(startRow, startColumn);
      // update en passant rights
      Piece movingPiece = _boardArrangement[row][column] as Piece;
      if (movingPiece.type == PieceType.pawn) {
        if (startRow == (movingPiece as Pawn).startRow && row == movingPiece.enPassantableRow) {
          _setEnPassantRightsForColorAgainstColumn(reverseColor(movingPiece.color), column, true);
        } else if (startRow == movingPiece.enPassantableRow) {
          _setEnPassantRightsForColorAgainstColumn(reverseColor(movingPiece.color), column, false);
        } else if (row == movingPiece.enPassantRow) {
          _enPassantRights[movingPiece.color]![column] = [false, false];
        }
      }
    }
  }

  void moveFrom(int startRow, int startColumn, int destRow, int destColumn) {
    int? playerIndex = _playerArrangement[startRow][startColumn];
    if (playerIndex != null) {
      move(playerIndex, destRow, destColumn);
    }
  }

  void killPlayer(int playerIndex) {
    Square? playerSquare = _playerLocations[playerIndex];
    if (playerSquare != null) {
      killPlayerAt(playerSquare.row, playerSquare.column);
    }
  }

  void killPlayerAt(int row, int column) {
    // update en passant rights
    Piece? dyingPiece = _boardArrangement[row][column];
    if (dyingPiece != null && dyingPiece.type == PieceType.pawn && row == (dyingPiece as Pawn).enPassantableRow) {
      _setEnPassantRightsForColorAgainstColumn(reverseColor(dyingPiece.color), column, false);
    }
    _boardArrangement[row][column] = null;
    _playerArrangement[row][column] = null;
    int? playerIndex = _playerArrangement[row][column];
    if (playerIndex != null) {
      _playerLocations[playerIndex] = null;
    }
    _updateCastleRights(row, column);
  }

  void promotePieceAt(int row, int column, PieceType promotionType) {
    _boardArrangement[row][column] = Piece.generate(promotionType, _boardArrangement[row][column]!.color);
  }
}


// interface
class Board {
  void initializeGame(PieceColor povColor) {}

  void update() {}

  set playerIndex(int playerIndex) {}
}

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