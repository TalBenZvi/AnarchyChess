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

  getMove = (position: Position, currentSquare:Square, row: number, column: number) => {
    for (let move of this.findLegalMoves(position, currentSquare)) {
      if (move.row == row && move.column == column) {
        return move;
      }
    }
    return null;
  }
}

abstract class UnblockablePiece extends Piece {
  private abstract get moveOffsets(): MoveOffset[];

  findLegalMoves = (position: Position, currentSquare: Square) {
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
  BlockablePiece(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/);

  List<MoveOffset> get _moveOffsets;

  @override
  List<Move> findLegalMoves(Position position, Square currentSquare) {
    List<Move> legalMoves = [];
    for (MoveOffset moveOffset in _moveOffsets) {
      Square destSquare = currentSquare.applyMove(moveOffset);
      while (destSquare.isOnTheBoard()) {
        Piece? destSquareOccupier = position.pieceAt(destSquare.row, destSquare.column);
        if (destSquareOccupier == null) {
          legalMoves.push(Move(destSquare.row, destSquare.column));
          destSquare = destSquare.applyMove(moveOffset);
        } else {
          if (color != destSquareOccupier.color) {
            legalMoves.push(Move(destSquare.row, destSquare.column, isCapture: true));
          }
          break;
        }
      }
    }
    return legalMoves;
  }
}

class Pawn extends Piece {
  late int _startRow;
  late int _promotionRow;
  late int _enPassantRow;
  late int _enPassantableRow;
  late List<MoveOffset> _moveOffsets;
  late List<MoveOffset> _captureMoveOffsets;

  Pawn(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/) {
    switch(color) {
      case PieceColor.white: {
        _startRow = 1;
        _promotionRow = BOARD_SIZE - 1;
        _enPassantRow = 4;
        _enPassantableRow = 3;
        _moveOffsets = [MoveOffset(1, 0), MoveOffset(2, 0)];
        _captureMoveOffsets = [MoveOffset(1, -1), MoveOffset(1, 1)];
      }
      break;
      case PieceColor.black: {
        _startRow = BOARD_SIZE - 2;
        _promotionRow = 0;
        _enPassantRow = 3;
        _enPassantableRow = 4;
        _moveOffsets = [MoveOffset(-1, 0), MoveOffset(-2, 0)];
        _captureMoveOffsets = [MoveOffset(-1, -1), MoveOffset(-1, 1)];
      }
      break;
    }
  }

  int get startRow => _startRow;

  int get enPassantRow => _enPassantRow;

  int get enPassantableRow => _enPassantableRow;

  @override
  PieceType get type => PieceType.pawn;

  @override
  List<Move> findLegalMoves(Position position, Square currentSquare) {
    List<Move> legalMoves = [];
    Square destSquare = currentSquare.applyMove(_moveOffsets[0]);
    if (destSquare.isOnTheBoard()) {
      Piece? destSquareOccupier = position.pieceAt(destSquare.row, destSquare.column);
      if (destSquareOccupier == null) {
        legalMoves.push(Move(destSquare.row, destSquare.column, isPromotion: destSquare.row == _promotionRow));
        if (currentSquare.row == _startRow) {
          destSquare = currentSquare.applyMove(_moveOffsets[1]);
          if (destSquare.isOnTheBoard()) {
            destSquareOccupier = position.pieceAt(destSquare.row, destSquare.column);
            if (destSquareOccupier == null) {
              legalMoves.push(Move(destSquare.row, destSquare.column));
            }
          }
        }
      }
    }
    for (int i = 0; i < _captureMoveOffsets.length; i++) {
      Square destSquare = currentSquare.applyMove(_captureMoveOffsets[i]);
      if (destSquare.isOnTheBoard()) {
        Piece? destSquareOccupier = position.pieceAt(destSquare.row, destSquare.column);
        bool isCaptureAvailable = destSquareOccupier != null && color != destSquareOccupier.color;
        bool isEnPassantAvailable = position.isEnPassantAvailable(color, currentSquare.column, i) && 
                                    (destSquareOccupier == null || color != destSquareOccupier.color);
        if (isCaptureAvailable || isEnPassantAvailable) {
          legalMoves.push(Move(destSquare.row, destSquare.column, isCapture: isCaptureAvailable, 
                              isEnPassant: isEnPassantAvailable, isPromotion: destSquare.row == _promotionRow));
        }
      }
    }

    return legalMoves;
  }
}

class Knight extends UnblockablePiece {
  Knight(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/);

  @override
  PieceType get type => PieceType.knight;

  @override
  List<MoveOffset> get _moveOffsets => [MoveOffset(1, 2), MoveOffset(2, 1), MoveOffset(1, -2), MoveOffset(-2, 1),
                                        MoveOffset(-1, 2), MoveOffset(2, -1), MoveOffset(-1, -2), MoveOffset(-2, -1)];
}

class Bishop extends BlockablePiece {
  Bishop(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/);

  @override
  PieceType get type => PieceType.bishop;

  @override
  List<MoveOffset> get _moveOffsets => [MoveOffset(1, 1), MoveOffset(1, -1), MoveOffset(-1, 1), MoveOffset(-1, -1)];
}

class Rook extends BlockablePiece {
  Rook(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/);

  @override
  PieceType get type => PieceType.rook;

  @override
  List<MoveOffset> get _moveOffsets => [MoveOffset(1, 0), MoveOffset(-1, 0), MoveOffset(0, 1), MoveOffset(0, -1)];
}

class Queen extends BlockablePiece {
  Queen(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/);

  @override
  PieceType get type => PieceType.queen;

  @override
  List<MoveOffset> get _moveOffsets => [MoveOffset(1, 0), MoveOffset(-1, 0), MoveOffset(0, 1), MoveOffset(0, -1),
                                        MoveOffset(1, 1), MoveOffset(1, -1), MoveOffset(-1, 1), MoveOffset(-1, -1)];
}

class King extends UnblockablePiece {
  late int _startRow;
  int startColumn = 4;

  King(PieceColor color/*, int row, int column*/) : super(color/*, row, column*/) {
    switch(color) {
      case PieceColor.white: {
        _startRow = 0;
      }
      break;
      case PieceColor.black: {
        _startRow = BOARD_SIZE - 1;
      }
      break;
    }
  }

  @override
  List<MoveOffset> get _moveOffsets => [MoveOffset(1, 1), MoveOffset(1, 0), MoveOffset(1, -1), 
                                        MoveOffset(0, 1),                    MoveOffset(0, -1), 
                                        MoveOffset(-1, 1), MoveOffset(-1, 0), MoveOffset(-1, -1)];

  @override
  PieceType get type => PieceType.king;

  @override
  List<Move> findLegalMoves(Position position, Square currentSquare) {
    List<Move> legalMoves = super.findLegalMoves(position, currentSquare);
    // castle check
    if (currentSquare.row == _startRow && currentSquare.column == startColumn) {
      bool canCastle = true;
      Piece? castleCandidate = position.pieceAt(currentSquare.row, 0);
      if (castleCandidate != null && castleCandidate.type == PieceType.rook && color == castleCandidate.color && position.isCastleAvailable(color, CastleSide.queenSide)) {
        for (int checkedColumn = 1; checkedColumn < currentSquare.column; checkedColumn++) {
          if (position.pieceAt(currentSquare.row, checkedColumn) != null) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) {
          legalMoves.push(Move(currentSquare.row, currentSquare.column - 2, isCastle: true, castleSide: CastleSide.queenSide));
        }
      }
      canCastle = true;
      castleCandidate = position.pieceAt(currentSquare.row, BOARD_SIZE - 1);
      if (castleCandidate != null && castleCandidate.type == PieceType.rook && color == castleCandidate.color && position.isCastleAvailable(color, CastleSide.kingSide)) {
        for (int checkedColumn = currentSquare.column + 1; checkedColumn < BOARD_SIZE - 1; checkedColumn++) {
          if (position.pieceAt(currentSquare.row, checkedColumn) != null) {
            canCastle = false;
            break;
          }
        }
        if (canCastle) {
          legalMoves.push(Move(currentSquare.row, currentSquare.column + 2, isCastle: true, castleSide: CastleSide.kingSide));
        }
      }
    }
    return legalMoves;
  }
}



class Position {
  // null means dead
  List<Square?> _playerLocations = [];
  // null means empty
  List<List<Piece?>> _boardArrangement = List.generate(BOARD_SIZE, (i) => List.filled(BOARD_SIZE, null));
  List<List<int?>> _playerArrangement = List.generate(BOARD_SIZE, (i) => List.filled(BOARD_SIZE, null));
  Map<PieceColor, Map<CastleSide, bool>> _castleRights = {PieceColor.white: {CastleSide.kingSide: false, CastleSide.queenSide: false},
                                                          PieceColor.black: {CastleSide.kingSide: false, CastleSide.queenSide: false}};
  /*
    _enPassantRights[color][column][direction] is whether or not a pawn of color 'color' on column 'column' can 
    en passant the pawn to its left / right
  */
  Map<PieceColor, List<List<bool>>> _enPassantRights = {PieceColor.white: List.generate(BOARD_SIZE, (i) => [false, false]),
                                                        PieceColor.black: List.generate(BOARD_SIZE, (i) => [false, false])};

  List<Square?> get playerLocations => [..._playerLocations];

  void setToStartingPosition() {
    _playerLocations = List.generate(BOARD_SIZE, (j) => Square(0, j)).toList() + 
                       List.generate(BOARD_SIZE, (j) => Square(1, j)).toList() + 
                       List.generate(BOARD_SIZE, (j) => Square(6, j)).toList() + 
                       List.generate(BOARD_SIZE, (j) => Square(7, j)).toList();
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