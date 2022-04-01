import * as React from "react";
import "./chess_board.css";
import Box from "@mui/material/Box";
import { Dialog } from "@headlessui/react";
import {
  Board,
  BOARD_SIZE,
  NUM_OF_PLAYERS,
  PlayingPiece,
  PieceColor,
  colorToString,
  typeToString,
  Move,
  PieceType,
} from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import {
  Button,
  Dimmer,
  Header,
  Icon,
  Image,
  Segment,
} from "semantic-ui-react";

import captureIcon from "../assets/action_icons/capture_icon.png";

function importAll(r: any) {
  let images: Map<string, any> = new Map<string, any>();
  r.keys().forEach((item: any, index: number) => {
    images.set(item.replace("./", ""), r(item));
  });
  return images;
}

const images = importAll(
  require.context("../assets/piece_icons", false, /\.(png|jpe?g|svg)$/)
);

const PROMOTION_TYPES: PieceType[] = [
  PieceType.knight,
  PieceType.bishop,
  PieceType.rook,
  PieceType.queen,
];

interface BoardComponentProps {
  size: number;
  lightColor: string;
  darkColor: string;
  povColor: PieceColor;
  clientFlowEngine: ClientFlowEngine;
}

interface BoardComponentState {
  povColor: PieceColor;
  playingPieces: PlayingPiece[];
  availableMoves: Move[];
  isPromotionDialogOpen: boolean;
}

class BoardComponent
  extends React.Component<BoardComponentProps, BoardComponentState>
  implements Board
{
  state = {
    povColor: this.props.povColor,
    playingPieces: [...Array(NUM_OF_PLAYERS)].map((_, i) => {
      return { piece: null as any, row: null as any, column: null as any };
    }),
    availableMoves: [],
    isPromotionDialogOpen: false,
  };
  movingPieceIndex: number = null as any;
  promotionMoveToSend: Move = null as any;

  constructor(props: BoardComponentProps) {
    super(props);
    props.clientFlowEngine.board = this;
  }

  setPieces = (
    playingPieces: PlayingPiece[],
    availableMoves: Move[],
    movingPieceIndex?: number
  ) => {
    let root = document.documentElement;
    let squareSize: number = this.props.size / BOARD_SIZE;
    if (
      movingPieceIndex != null &&
      this.state.playingPieces[movingPieceIndex] != null
    ) {
      root.style.setProperty(
        "--prev-row",
        (
          this.fitRowIndexToPOV(
            this.state.playingPieces[movingPieceIndex].row
          ) * squareSize
        ).toString() + "px"
      );
      root.style.setProperty(
        "--prev-column",
        (
          this.fitColumnIndexToPOV(
            this.state.playingPieces[movingPieceIndex].column
          ) * squareSize
        ).toString() + "px"
      );
      root.style.setProperty(
        "--current-row",
        (
          this.fitRowIndexToPOV(playingPieces[movingPieceIndex].row) *
          squareSize
        ).toString() + "px"
      );
      root.style.setProperty(
        "--current-column",
        (
          this.fitColumnIndexToPOV(playingPieces[movingPieceIndex].column) *
          squareSize
        ).toString() + "px"
      );
    }
    this.movingPieceIndex = movingPieceIndex as any;
    this.setState((state: BoardComponentState, props: BoardComponentProps) => {
      return {
        playingPieces: playingPieces,
        availableMoves: availableMoves,
      };
    });
  };

  private fitRowIndexToPOV(rowIndex: number): number {
    return this.state.povColor === PieceColor.white
      ? BOARD_SIZE - 1 - rowIndex
      : rowIndex;
  }

  private fitColumnIndexToPOV(columnIndex: number): number {
    return this.state.povColor === PieceColor.white
      ? columnIndex
      : BOARD_SIZE - 1 - columnIndex;
  }

  private sendMove(move: Move): void {
    this.props.clientFlowEngine.sendMove(move);
  }

  private openPromotionDialog(move: Move) {
    this.promotionMoveToSend = move;
    this.setState((state: BoardComponentState, props: BoardComponentProps) => {
      return { isPromotionDialogOpen: true };
    });
  }

  private closePromotionDialog(): void {
    this.promotionMoveToSend = null as any;
    this.setState((state: BoardComponentState, props: BoardComponentProps) => {
      return { isPromotionDialogOpen: false };
    });
  }


  render() {
    let { size, lightColor, darkColor } = this.props;
    let { povColor, playingPieces, availableMoves, isPromotionDialogOpen } =
      this.state;
    let squareSize: number = size / BOARD_SIZE;
    let coordinateIndexFontSize: number = size * 0.03;
    let moveIndicatorSize: number = squareSize * 0.5;
    let promotionDialogButtonSize: number = squareSize * 1.5;
    return (
      <Box
        sx={{
          width: size,
          height: size,
        }}
      >
        {/* squares */}
        <ul className="no-bullets">
          {[...Array(BOARD_SIZE)].map((_, i) => (
            <li key={Math.random()}>
              <div className="row">
                <ul className="row">
                  {[...Array(BOARD_SIZE)].map((_, j) => {
                    let isLight: boolean = (i + j) % 2 === 0;
                    return (
                      <li key={Math.random()}>
                        <Box
                          sx={{
                            width: squareSize,
                            height: squareSize,
                            backgroundColor: isLight ? lightColor : darkColor,
                          }}
                        >
                          {/* coordinate indicators */}
                          <div style={{ position: "relative" }}>
                            {j === 0 ? (
                              <div
                                style={{
                                  fontSize: coordinateIndexFontSize,
                                  position: "absolute" as any,
                                  left: squareSize * 0.07,
                                  top: squareSize * 0.02,
                                  color: isLight ? darkColor : lightColor,
                                }}
                              >
                                {povColor === PieceColor.white
                                  ? BOARD_SIZE - i
                                  : i + 1}
                              </div>
                            ) : (
                              <div />
                            )}
                            {i === BOARD_SIZE - 1 ? (
                              <div
                                style={{
                                  fontSize: coordinateIndexFontSize,
                                  position: "absolute" as any,
                                  left: squareSize * 0.8,
                                  top: squareSize * 0.68,
                                  color: isLight ? darkColor : lightColor,
                                }}
                              >
                                {String.fromCharCode(
                                  "a".charCodeAt(0) +
                                    (povColor === PieceColor.white
                                      ? j
                                      : BOARD_SIZE - 1 - j)
                                )}{" "}
                              </div>
                            ) : (
                              <div />
                            )}
                          </div>
                        </Box>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </li>
          ))}
        </ul>
        {/* pieces */}
        <ul className="no-bullets">
          {[...Array(NUM_OF_PLAYERS)].map((_, i) => {
            let playingPiece: PlayingPiece = playingPieces[i];
            if (playingPiece.piece == null) {
              return <li key={Math.random()}></li>;
            }
            let pieceImage = (
              <img
                src={images.get(
                  `${colorToString.get(
                    playingPiece.piece.color
                  )}_${typeToString.get(playingPiece.piece.type)}.png`
                )}
                height={squareSize}
                width={squareSize}
                alt=""
              />
            );
            if (i === this.movingPieceIndex) {
              this.movingPieceIndex = null as any;
              return (
                <li key={Math.random()}>
                  <div className="moving-piece">{pieceImage}</div>
                </li>
              );
            }
            return (
              <li key={Math.random()}>
                <div
                  style={{
                    position: "absolute",
                    left:
                      this.fitColumnIndexToPOV(playingPiece.column) *
                      squareSize,
                    top: this.fitRowIndexToPOV(playingPiece.row) * squareSize,
                  }}
                >
                  {pieceImage}
                </div>
              </li>
            );
          })}
        </ul>
        {/* moves */}
        <ul className="no-bullets">
          {availableMoves.map((move) => (
            <li key={Math.random()}>
              <div
                style={{
                  position: "absolute",
                  left:
                    this.fitColumnIndexToPOV((move as Move).column) *
                    squareSize,
                  top: this.fitRowIndexToPOV((move as Move).row) * squareSize,
                }}
              >
                <button
                  onClick={() => {
                    if ((move as Move).isPromotion) {
                      this.openPromotionDialog(move);
                    } else {
                      this.sendMove(move);
                    } 
                  }}
                  style={{
                    width: squareSize,
                    height: squareSize,
                  }}
                >
                  {(move as Move).isCapture ? (
                    <div>
                      <img
                        src={captureIcon}
                        height={squareSize}
                        width={squareSize}
                        style={{ opacity: 0.3 }}
                        alt=""
                      />
                    </div>
                  ) : (
                    <div
                      className="move-indicator"
                      style={{
                        width: moveIndicatorSize,
                        height: moveIndicatorSize,
                        margin: 0.5 * (squareSize - moveIndicatorSize),
                      }}
                    />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {/* promotion dialog */}
        <Dialog
          open={isPromotionDialogOpen}
          onClose={() => {
            this.closePromotionDialog();
          }}
        >
          <div
            style={{
              position: "absolute",
              boxShadow: "0 0 0 100vmax rgba(0, 0, 0, 0.7)",
              pointerEvents: "none",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "white",
              width: promotionDialogButtonSize,
              height:
                promotionDialogButtonSize * (PROMOTION_TYPES.length + 0.1),
              borderRadius: promotionDialogButtonSize * 0.1,
            }}
          ></div>
          <div className="centered">
            <ul className="no-bullets">
              {PROMOTION_TYPES.map((type) => {
                return (
                  <li key={Math.random()}>
                    <div>
                      <button
                        onClick={() => {
                          this.promotionMoveToSend.promotionType = type;
                          this.sendMove(this.promotionMoveToSend);
                          this.closePromotionDialog();
                        }}
                        style={{
                          height: promotionDialogButtonSize,
                          width: promotionDialogButtonSize,
                        }}
                      >
                        <img
                          src={images.get(
                            `${colorToString.get(povColor)}_${typeToString.get(
                              type
                            )}.png`
                          )}
                          height={promotionDialogButtonSize}
                          width={promotionDialogButtonSize}
                          alt=""
                        />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </Dialog>
      </Box>
    );
  }
}

export default BoardComponent;
