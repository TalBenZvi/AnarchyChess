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
        {/* title */}
        <div
          className="centered-title"
          style={{
            position: "absolute",
            fontSize: height * 0.2,
            fontWeight: "bold",
          }}
        >
          Scoreboard
        </div>
        {/* score */}
        <div
          className="row"
          style={{
            position: "absolute",
            left: "50%",
            bottom: "40%",
            transform: "translate(-50%, 50%)",
            fontSize: height * 0.5,
            fontWeight: "bold",
          }}
        >
          {/* white score */}
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
          {/* hyphen */}
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
          {/* black score */}
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
