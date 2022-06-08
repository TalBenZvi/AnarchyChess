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
  colorToString,
  reverseColor,
} from "../game_flow_util/game_elements";

const TITLE_COLORS: Map<PieceColor, string> = new Map([
  [PieceColor.white, "#d2d2d2"],
  [PieceColor.black, "#111111"],
]);

const OUTLINE_COLORS: Map<PieceColor, string> = new Map([
  [PieceColor.white, "#888888"],
  [PieceColor.black, "#111111"],
]);

const VICTORY_COLOR: string = "#dddddd";
const DEFEAT_COLOR: string = "#000";

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
  state = { winningColor: null as any };
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
    let isVictory: boolean = winningColor === this.playerColor;
    let titleColor: string = TITLE_COLORS.get(winningColor) as string;
    let outlineColor: string = OUTLINE_COLORS.get(
      reverseColor(winningColor)
    ) as string;
    let backgroundColor: string = isVictory ? VICTORY_COLOR : DEFEAT_COLOR;
    return (
      <div>
        <div
          className="flashing-screen"
          style={{
            boxShadow: `0 0 0 100vmax ${backgroundColor}`,
          }}
        />
        <p
          className="centered-title"
          style={{
            position: "fixed",
            left: 0,
            top: "50%",
            transform: "translate(0%, -150%)",
            width: "100%",
            zIndex: 3,
            opacity: 1,
            fontSize: 200,
            textAlign: "center",
            fontWeight: "bold",
            WebkitTextFillColor: titleColor,
            WebkitTextStroke: "1px",
            WebkitTextStrokeColor: outlineColor,
          }}
        >
          {isVictory ? "VICTORY" : "DEFEAT"}
        </p>
      </div>
    );
  }
}

export default GameEndScreen;
