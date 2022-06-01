import * as React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

import {
  PieceColor,
  reverseColor,
  Piece,
  colorToString,
  typeToString,
  Position,
} from "../game_flow_util/game_elements";
import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";

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

const ROW_SIZE: number = 5;
const NUM_OF_ROWS: number = 6;

interface GraveYardItem {
  imagePath: string;
  respawnCompletionTime: number;
}

interface GraveYardProps {
  width: number;
  height: number;
  backgroundColor: string;
  tileColor: string;
  povColor: PieceColor;
  clientFlowEngine: ClientFlowEngine;
}

interface GraveYardState {
  povColor: PieceColor;
  graveYardItems: Map<PieceColor, GraveYardItem[]>;
}

class GraveYard
  extends React.Component<GraveYardProps, GraveYardState>
  implements ClientFlowEngineObserver
{
  state = {
    povColor: this.props.povColor,
    graveYardItems: new Map<PieceColor, GraveYardItem[]>([
      [PieceColor.white, []],
      [PieceColor.black, []],
    ]),
  };
  private _isMounted: boolean = false;

  constructor(props: GraveYardProps) {
    super(props);
    if (props.clientFlowEngine != null) {
      props.clientFlowEngine.addObserver(this);
    }
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.props.clientFlowEngine.playerIndex != null) {
      this.setPovColor(
        Position.getStartPieceByPlayer(this.props.clientFlowEngine.playerIndex)
          .color
      );
    }
  }

  private addPiece(piece: Piece, respawnCompletionTime: number): void {
    this.setState(() => {
      let newGraveYardItems: Map<PieceColor, GraveYardItem[]> = new Map<
        PieceColor,
        GraveYardItem[]
      >([
        [
          PieceColor.white,
          [
            ...(this.state.graveYardItems.get(
              PieceColor.white
            ) as GraveYardItem[]),
          ],
        ],
        [
          PieceColor.black,
          [
            ...(this.state.graveYardItems.get(
              PieceColor.black
            ) as GraveYardItem[]),
          ],
        ],
      ]);
      newGraveYardItems.get(piece.color)?.push({
        imagePath: `${colorToString.get(piece.color)}_${typeToString.get(
          piece.type
        )}.png`,
        respawnCompletionTime: respawnCompletionTime,
      });
      newGraveYardItems.get(piece.color)?.sort((item1, item2) => {
        return item1.respawnCompletionTime - item2.respawnCompletionTime;
      });
      return {
        graveYardItems: newGraveYardItems,
      };
    });
  }

  private removeItem(color: PieceColor, itemIndex: number) {
    this.setState(() => {
      let newGraveYardItems: Map<PieceColor, GraveYardItem[]> = new Map<
        PieceColor,
        GraveYardItem[]
      >([
        [
          PieceColor.white,
          [
            ...(this.state.graveYardItems.get(
              PieceColor.white
            ) as GraveYardItem[]),
          ],
        ],
        [
          PieceColor.black,
          [
            ...(this.state.graveYardItems.get(
              PieceColor.black
            ) as GraveYardItem[]),
          ],
        ],
      ]);
      newGraveYardItems.get(color)?.splice(itemIndex, 1);
      return {
        graveYardItems: newGraveYardItems,
      };
    });
  }

  private setPovColor(povColor: PieceColor): void {
    this.setState(() => {
      return { povColor: povColor };
    });
  }

  private clear(): void {
    this.setState(() => {
      return {
        graveYardItems: new Map<PieceColor, GraveYardItem[]>([
          [PieceColor.white, []],
          [PieceColor.black, []],
        ]),
      };
    });
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.roleAssigned: {
        if (this._isMounted) {
          this.clear();
          this.setPovColor(
            Position.getStartPieceByPlayer(
              info.get(ClientEventInfo.playerIndex)
            ).color
          );
        }
        break;
      }
      case ClientEventType.death: {
        this.addPiece(
          Position.getStartPieceByPlayer(
            info.get(ClientEventInfo.dyingPlayerIndex)
          ),
          new Date().getTime() + info.get(ClientEventInfo.deathTimer) * 1000
        );
        break;
      }
    }
  }

  private tile(
    tileSize: number,
    margin: number,
    contrast: number,
    color: PieceColor,
    itemIndex: number
  ) {
    let { imagePath, respawnCompletionTime } = (
      this.state.graveYardItems.get(color) as GraveYardItem[]
    )[itemIndex];
    return (
      <div
        style={{
          width: tileSize,
          height: tileSize,
          backgroundColor: this.props.tileColor,
          borderRadius: 10,
          margin: margin,
          marginTop: 15,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            color: "#cc2222",
            fontSize: tileSize * 0.8,
            textShadow: "3px 3px #000000",
            zIndex: 2,
          }}
        >
          <CountdownCircleTimer
            size={tileSize}
            isPlaying={true}
            duration={(respawnCompletionTime - new Date().getTime()) / 1000}
            colors={"#ffffff00"}
            trailColor="#ffffff00"
            onComplete={() => {
              this.removeItem(color, itemIndex);
            }}
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
        <div
          style={{
            filter: `contrast(${contrast * 100}%)`,
          }}
        >
          <img
            src={images.get(imagePath)}
            height={tileSize}
            width={tileSize}
            alt=""
          />
        </div>
      </div>
    );
  }

  render() {
    let { povColor, graveYardItems } = this.state;
    let tileSize: number = (this.props.width / ROW_SIZE) * 0.85;
    let margin: number = (this.props.width / ROW_SIZE - tileSize) / 2;
    let graveYardItemsByRows: GraveYardItem[][] = [...Array(NUM_OF_ROWS)].map(
      (_, i) => []
    );
    graveYardItemsByRows[0] = (
      graveYardItems.get(reverseColor(povColor)) as GraveYardItem[]
    ).slice(0, ROW_SIZE);
    graveYardItemsByRows[1] = (
      graveYardItems.get(reverseColor(povColor)) as GraveYardItem[]
    ).slice(ROW_SIZE, 2 * ROW_SIZE);
    graveYardItemsByRows[2] = (
      graveYardItems.get(reverseColor(povColor)) as GraveYardItem[]
    ).slice(2 * ROW_SIZE, 3 * ROW_SIZE);
    graveYardItemsByRows[3] = (
      graveYardItems.get(povColor) as GraveYardItem[]
    ).slice(0, ROW_SIZE);
    graveYardItemsByRows[4] = (
      graveYardItems.get(povColor) as GraveYardItem[]
    ).slice(ROW_SIZE, 2 * ROW_SIZE);
    graveYardItemsByRows[5] = (
      graveYardItems.get(povColor) as GraveYardItem[]
    ).slice(2 * ROW_SIZE, 3 * ROW_SIZE);
    return (
      <div
        style={{
          width: this.props.width,
          height: this.props.height,
          backgroundColor: this.props.backgroundColor,
          borderRadius: 20,
        }}
      >
        <ul className="no-bullets">
          {graveYardItemsByRows
            .slice(0, NUM_OF_ROWS / 2)
            .map((graveYardItemRow: GraveYardItem[], i) => {
              return (
                <li key={Math.random()}>
                  <ul className="no-bullets">
                    <div className="row">
                      {graveYardItemRow.map(
                        (graveYardItem: GraveYardItem, j) => (
                          <li key={Math.random()}>
                            {this.tile(
                              tileSize,
                              margin,
                              0.5,
                              reverseColor(this.state.povColor),
                              i * ROW_SIZE + j
                            )}
                          </li>
                        )
                      )}
                    </div>
                  </ul>
                </li>
              );
            })}
        </ul>
        <div
          style={{
            position: "absolute",
            top: "49%",
            left: "50%",
            transform: "translate(-50%, 0%)",
          }}
        >
          <hr
            style={{
              width: this.props.width * 0.95,
              border: `1px solid ${this.props.tileColor}`,
            }}
          />
          <ul className="no-bullets">
            {graveYardItemsByRows
              .slice(NUM_OF_ROWS / 2, NUM_OF_ROWS)
              .map((graveYardItemRow: GraveYardItem[], i) => {
                return (
                  <li key={Math.random()}>
                    <ul className="no-bullets">
                      <div className="row">
                        {graveYardItemRow.map(
                          (graveYardItem: GraveYardItem, j) => (
                            <li key={Math.random()}>
                              {this.tile(
                                tileSize,
                                margin,
                                0.5,
                                this.state.povColor,
                                i * ROW_SIZE + j
                              )}
                            </li>
                          )
                        )}
                      </div>
                    </ul>
                  </li>
                );
              })}
          </ul>
        </div>
      </div>
    );
  }
}

export default GraveYard;
