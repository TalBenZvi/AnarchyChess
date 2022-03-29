import * as React from "react";
import Box from "@mui/material/Box";
import { BOARD_SIZE, PieceColor } from "../game_flow_util/game_elements";

interface BoardComponentProps {
  size: number;
  lightColor: string;
  darkColor: string;
  povColor: PieceColor;
}

interface BoardComponentState {
  povColor: PieceColor;
}

class BoardComponent extends React.Component<
  BoardComponentProps,
  BoardComponentState
> {
  state = { povColor: this.props.povColor };

  /*
  constructor(props: BoardComponentProps) {
    super(props);
  }
  */

  render() {
    let { size, lightColor, darkColor } = this.props;
    let { povColor } = this.state;
    let squareSize: number = size / BOARD_SIZE;
    let coordinateIndexFontSize: number = size / 30;
    return (
      <Box
        sx={{
          width: size,
          height: size,
        }}
      >
        <ul className="no-bullets">
          {[...Array(BOARD_SIZE)].map((_, i) => (
            <li>
              <div className="row">
                {[...Array(BOARD_SIZE)].map((_, j) => {
                  let isLight: boolean = (i + j) % 2 === 0;
                  return (
                    <li>
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
                              {String.fromCharCode("a".charCodeAt(0) + (povColor === PieceColor.white ? j : BOARD_SIZE - 1 - j))}{" "}
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                      </Box>
                    </li>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
      </Box>
    );
  }
}

export default BoardComponent;
