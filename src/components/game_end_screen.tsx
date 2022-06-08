import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
  GAME_START_DELAY,
} from "../client_side/client_flow_engine";
import { EventInfo } from "../game_flow_util/communication";
import {
  PieceColor,
  Piece,
  Bishop,
  Position,
} from "../game_flow_util/game_elements";

const WHITE_TITLE_COLOR: string = "#d2d2d2";
const BLACK_TITLE_COLOR: string = "#111111";

const WHITE_OUTLINE_COLOR: string = "#888888";
const BLACK_OUTLINE_COLOR: string = "#111111";

interface GameEndScreenProps {
  clientFlowEngine: ClientFlowEngine;
}

interface GameEndScreenState {
  winningColor: PieceColor;
}

class GameEndScreen
  extends React.Component<GameEndScreenProps, GameEndScreenState>
  implements ClientFlowEngineObserver
{
  state = { winningColor: PieceColor.black };
  private playerColor: PieceColor = null as any;

  componentDidMount() {
    let clientFlowEngine: ClientFlowEngine = this.props.clientFlowEngine;
    if (clientFlowEngine != null) {
      clientFlowEngine.addObserver(this);
    }
  }

  componentWillUnmount() {
    let clientFlowEngine: ClientFlowEngine = this.props.clientFlowEngine;
    if (clientFlowEngine != null) {
      clientFlowEngine.removeObserver(this);
    }
  }

  private show(winningColor: PieceColor): void {
    this.setState(() => {
      return { winningColor: winningColor };
    });
  }

  private hide(): void {
    this.setState(() => {
      return { winningColor: null as any };
    });
  }

  notify(eventType: ClientEventType, eventInfo: Map<ClientEventInfo, any>) {
    switch (eventType) {
      case ClientEventType.roleAssigned: {
        this.playerColor = Position.getStartPieceByPlayer(
          eventInfo.get(ClientEventInfo.playerIndex)
        ).color;
        this.hide();
        break;
      }
      case ClientEventType.gameEnded: {
        this.show(eventInfo.get(ClientEventInfo.winningColor));
        break;
      }
    }
  }

  render() {
    let { winningColor } = this.state;
    if (winningColor == null) {
      return <div />;
    }
    let titleColor: string =
      winningColor === PieceColor.white ? WHITE_TITLE_COLOR : BLACK_TITLE_COLOR;
    let outlineColor: string =
      winningColor === PieceColor.white
        ? BLACK_OUTLINE_COLOR
        : WHITE_OUTLINE_COLOR;
    return (
      <div
        style={{
          position: "absolute",
          boxShadow: "0 0 0 100vmax rgba(80, 80, 80, 0.7)",
          background: "gray",
          zIndex: 3,
          fontWeight: "bold",
        }}
      >
        <p
          className="centered-title"
          style={{
            position: "fixed",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -150%)",
            zIndex: 3,
            fontSize: 200,
            WebkitTextFillColor: titleColor,
            WebkitTextStroke: "1px",
            WebkitTextStrokeColor: outlineColor,
          }}
        >
          {this.playerColor === winningColor ? "VICTORY" : "DEFEAT"}
        </p>
      </div>
    );
  }
}

export default GameEndScreen;
