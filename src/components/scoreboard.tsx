import * as React from "react";

import {
  PieceColor,
  reverseColor,
  Piece,
  colorToString,
  typeToString,
  Position,
  PieceType,
} from "../game_flow_util/game_elements";

import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";

interface ScoreBoardProps {
  width: number;
  height: number;
  clientFlowEngine: ClientFlowEngine;
}

interface ScoreBoardState {
  whiteTeamScore: number;
  blackTeamScore: number;
}

class ScoreBoard
  extends React.Component<ScoreBoardProps, ScoreBoardState>
  implements ClientFlowEngineObserver
{
  state = {
    whiteTeamScore: 1,
    blackTeamScore: 0,
  };
  private _isMounted: boolean = false;

  componentDidMount() {
    this._isMounted = true;
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

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.roleAssigned: {
        break;
      }
    }
  }

  render() {
    let { width, height } = this.props;
    let { whiteTeamScore, blackTeamScore } = this.state;
    return (
      <div
        className="highlighted-area"
        style={{
          width: width,
          height: height,
        }}
      >
        <div
          className="centered-title"
          style={{
            position: "absolute",
            fontSize: width * 0.13,
            fontWeight: "bold",
          }}
        >
          Scoreboard
        </div>
        <div
          className="row"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 0,
            transform: "translate(-50%, 0%)",
            fontSize: width * 0.32,
            fontWeight: "bold",
          }}
        >
          <div
            style={{
              position: "relative",
              WebkitTextFillColor: "#d2d2d2",
              WebkitTextStroke: "1px",
              WebkitTextStrokeColor: "#111111",
            }}
          >
            {`${whiteTeamScore}`}
          </div>
          <div
            style={{
              position: "relative",
              WebkitTextFillColor: "#666666",
              WebkitTextStrokeColor: "#666666",
              marginInline: width * 0.1,
            }}
          >
            {" - "}
          </div>
          <div
            style={{
              position: "relative",
              WebkitTextFillColor: "#111111",
              WebkitTextStroke: "1px",
              WebkitTextStrokeColor: "#666666",
            }}
          >
            {`${blackTeamScore}`}
          </div>
        </div>
      </div>
    );
  }
}

export default ScoreBoard;
