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
} from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

import { useState } from "react";

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
  movingPieceIndex: number;
  isPromotionDialogOpen: boolean;
}

class BoardComponent
  extends React.Component<BoardComponentProps, BoardComponentState>
  implements Board {
  state = {
    povColor: this.props.povColor,
    playingPieces: [...Array(NUM_OF_PLAYERS)].map((_, i) => {
      return { piece: null as any, row: null as any, column: null as any };
    }),
    availableMoves: [],
    movingPieceIndex: null as any,
    isPromotionDialogOpen: true,
  };

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
    this.setState((state: BoardComponentState, props: BoardComponentProps) => {
      return {
        playingPieces: playingPieces,
        availableMoves: availableMoves,
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

  private setIsPromotionDialogOpen(isPromotionDialogOpen: boolean) {
    this.setState(
      (state: BoardComponentState, props: BoardComponentProps) => {
        return { isPromotionDialogOpen: isPromotionDialogOpen };
      }
    )
  }

  render() {
    let { size, lightColor, darkColor } = this.props;
    let { povColor } = this.state;
    let squareSize: number = size / BOARD_SIZE;
    let coordinateIndexFontSize: number = size * 0.03;
    let moveIndicatorSize: number = squareSize * 0.5;
    let movingPieceIndex: number = this.state.movingPieceIndex;
    this.state.movingPieceIndex = null;
    return (
      <Box
        sx={{
          width: size,
          height: size,
        }}
      >
        <Dialog
          open={this.state.isPromotionDialogOpen}
          onClose={() => this.setIsPromotionDialogOpen(false)}
        >
          <Dialog.Overlay />

          <Dialog.Title>Deactivate account</Dialog.Title>
          <Dialog.Description>
            This will permanently deactivate your account
          </Dialog.Description>

          <p>
            Are you sure you want to deactivate your account? All of your data
            will be permanently removed. This action cannot be undone.
          </p>

          <button onClick={() => this.setIsPromotionDialogOpen(false)}>Deactivate</button>
          <button onClick={() => this.setIsPromotionDialogOpen(false)}>Cancel</button>
        </Dialog>
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
        {/* moves */}
        <ul className="no-bullets">
          {this.state.availableMoves.map((move) => (
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
                    this.props.clientFlowEngine.sendMove(move);
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
      </Box>
    );
  }
}

export default BoardComponent;
