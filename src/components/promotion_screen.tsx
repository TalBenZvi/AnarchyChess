import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import {
  PromotionScreenComponent,
  Move,
  PieceType,
  PieceColor,
  colorToString,
  typeToString,
} from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { Dialog } from "@headlessui/react";

const PROMOTION_TYPES: PieceType[] = [
  PieceType.knight,
  PieceType.bishop,
  PieceType.rook,
  PieceType.queen,
];
const BUTTON_SIZE = 150;

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

interface PromotionScreenProps {
  clientFlowEngine: ClientFlowEngine;
}

interface PromotionScreenState {
  isActive: boolean;
  move: Move;
  color: PieceColor;
}

class PromotionScreen
  extends React.Component<PromotionScreenProps, PromotionScreenState>
  implements PromotionScreenComponent {
  state = { isActive: false, move: null as any, color: null as any };
  canBeClosed: boolean = false;

  constructor(props: PromotionScreenProps) {
    super(props);
    props.clientFlowEngine.promotionScreen = this;
  }

  show(move: Move, color: PieceColor): void {
    this.setState(() => {
      return { isActive: true, move: move, color: color };
    });
    setTimeout(() => {
      this.canBeClosed = true;
    }, 100);
  }

  hide(): void {
    this.setState(() => {
      return { isActive: false, move: null as any, color: null as any };
    });
    this.canBeClosed = false;
  }

  render() {
    let { isActive, move, color } = this.state;
    return move != null && color != null ? (
      <Dialog
        open={isActive}
        onClose={() => {
          if (this.canBeClosed) {
            this.hide();
          }
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
            width: BUTTON_SIZE,
            height: BUTTON_SIZE * (PROMOTION_TYPES.length + 0.1),
            borderRadius: BUTTON_SIZE * 0.1,
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
                        let moveToSend = move;
                        moveToSend.promotionType = type;
                        this.props.clientFlowEngine.sendMove(moveToSend);
                        this.hide();
                      }}
                      style={{
                        height: BUTTON_SIZE,
                        width: BUTTON_SIZE,
                        background: "none",
                        color: "white",
                        border: "none",
                        padding: 0,
                        font: "inherit",
                        cursor: "pointer",
                        outline: "inherit",
                      }}
                    >
                      <img
                        src={images.get(
                          `${colorToString.get(color)}_${typeToString.get(
                            type
                          )}.png`
                        )}
                        height={BUTTON_SIZE}
                        width={BUTTON_SIZE}
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
    ) : (
      <div />
    );
  }
}

export default PromotionScreen;
