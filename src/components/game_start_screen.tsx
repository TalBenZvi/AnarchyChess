import React from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";

import {
  ClientFlowEngine,
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
  GAME_START_DELAY,
} from "../client_side/client_flow_engine";
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

interface GameStartScreenProps {
  clientFlowEngine: ClientFlowEngine;
}

interface GameStartScreenState {
  isActive: boolean;
  piece: Piece;
  gameStartTimer: number;
}

class GameStartScreen
  extends React.Component<GameStartScreenProps, GameStartScreenState>
  implements ClientFlowEngineObserver
{
  state = { isActive: false, piece: null as any, gameStartTimer: 0 };
  private _isMounted: boolean = false;

  constructor(props: GameStartScreenProps) {
    super(props);
    if (props.clientFlowEngine != null) {
      props.clientFlowEngine.addObserver(this);
    }
  }

  componentDidMount() {
    this._isMounted = true;
    if (this.props.clientFlowEngine.playerIndex != null) {
      this.show(
        Position.getStartPieceByPlayer(this.props.clientFlowEngine.playerIndex),
        GAME_START_DELAY
      );
    }
  }

  private show(piece: Piece, gameStartTimer: number): void {
    this.setState(() => {
      return { isActive: true, piece: piece, gameStartTimer: gameStartTimer };
    });
  }

  private hide(): void {
    this.setState(() => {
      return { isActive: false };
    });
  }

  notify(eventType: ClientEventType, eventInfo: Map<ClientEventInfo, any>) {
    switch (eventType) {
      case ClientEventType.roleAssigned: {
        if (this._isMounted) {
          this.show(
            Position.getStartPieceByPlayer(
              eventInfo.get(ClientEventInfo.playerIndex)
            ),
            GAME_START_DELAY
          );
        }
        break;
      }
      case ClientEventType.gameStarted: {
        this.hide();
        break;
      }
    }
  }

  render() {
    let { isActive, piece, gameStartTimer } = this.state;
    if (!isActive) {
      return <div />;
    }
    let titleColor: string =
      piece.color === PieceColor.white ? WHITE_TITLE_COLOR : BLACK_TITLE_COLOR;
    let outlineColor: string = piece.color === PieceColor.white ? BLACK_OUTLINE_COLOR : WHITE_OUTLINE_COLOR;
    return (
      <div
        style={{
          position: "absolute",
          boxShadow: "0 0 0 100vmax rgba(80, 80, 80, 0.7)",
          //color: "titleColor",
          background: "gray",
          zIndex: 3,
          fontWeight: "bold",
        }}
      >
        <p
          className="centered-title"
          style={{
            top: 0,
            zIndex: 3,
            fontSize: 50,
            WebkitTextFillColor: titleColor,
            WebkitTextStroke: "1px",
            WebkitTextStrokeColor: outlineColor,
          }}
        >
          You Are Playing The
        </p>
        <p
          className="centered-title"
          style={{
            top: 110,
            zIndex: 3,
            fontSize: 120,
            WebkitTextFillColor: titleColor,
            WebkitTextStroke: "1px",
            WebkitTextStrokeColor: outlineColor,
          }}
        >
          {piece.toString()}
        </p>
        <p
          className="centered-title"
          style={{
            top: 590,
            zIndex: 3,
            fontSize: 30,
            WebkitTextFillColor: titleColor,
            WebkitTextStroke: "0.5px",
            WebkitTextStrokeColor: outlineColor,
          }}
        >
          game starting in
        </p>
        <div
          className="centered-title"
          style={{
            top: 620,
            zIndex: 3,
            fontSize: 60,
            WebkitTextFillColor: titleColor,
            WebkitTextStroke: "1px",
            WebkitTextStrokeColor: outlineColor,
          }}
        >
          <CountdownCircleTimer
            isPlaying={true}
            duration={gameStartTimer}
            colors={"#ffffff00"}
            trailColor="#ffffff00"
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      </div>
    );
  }
}

export default GameStartScreen;
