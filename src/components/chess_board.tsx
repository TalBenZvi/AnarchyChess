import * as React from "react";
import Box from "@mui/material/Box";
import {
  Board,
  BOARD_SIZE,
  NUM_OF_PLAYERS,
  PlayingPiece,
  PieceColor,
  colorToString,
  typeToString,
} from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

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
  movingPieceIndex: number;
}

class BoardComponent
  extends React.Component<BoardComponentProps, BoardComponentState>
  implements Board {
  state = {
    povColor: this.props.povColor,
    playingPieces: [...Array(NUM_OF_PLAYERS)].map((_, i) => {
      return { piece: null as any, row: null as any, column: null as any };
    }),
    movingPieceIndex: null as any,
  };

  constructor(props: BoardComponentProps) {
    super(props);
    props.clientFlowEngine.board = this;
  }

  setPieces = (playingPieces: PlayingPiece[], movingPieceIndex?: number) => {
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
    this.setState((state: BoardComponentState, props: BoardComponentProps) => {
      return {
        playingPieces: playingPieces,
        movingPieceIndex: movingPieceIndex as any,
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

  render() {
    let { size, lightColor, darkColor } = this.props;
    let { povColor } = this.state;
    let squareSize: number = size / BOARD_SIZE;
    let coordinateIndexFontSize: number = size / 30;
    let movingPieceIndex: number = this.state.movingPieceIndex;
    this.state.movingPieceIndex = null;
    return (
      <Box
        sx={{
          width: size,
          height: size,
        }}
      >
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
        <ul className="no-bullets">
          {[...Array(NUM_OF_PLAYERS)].map((_, i) => {
            let playingPiece: PlayingPiece = this.state.playingPieces[i];
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
            if (i === movingPieceIndex) {
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
      </Box>
    );
  }
}

export default BoardComponent;
