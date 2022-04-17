import React, { Component } from "react";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { DeathScreenComponent } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

const FONT_COLOR: string = "#900000";

interface DeathScreenProps {
  clientFlowEngine: ClientFlowEngine;
}

interface DeathScreenState {
  isActive: boolean;
  respawnTimer: number;
}

class DeathScreen
  extends React.Component<DeathScreenProps, DeathScreenState>
  implements DeathScreenComponent {
  state = { isActive: false, respawnTimer: 0 };

  constructor(props: DeathScreenProps) {
    super(props);
    props.clientFlowEngine.deathScreen = this;
  }

  show(respawnTimer: number): void {
    this.setState(() => {
      return { isActive: true, respawnTimer: respawnTimer };
    });
  }

  hide(): void {
    this.setState(() => {
      return { isActive: false};
    });
  }

  render() {
    return this.state.isActive ? (
      <div
        style={{
          position: "absolute",
          boxShadow: "0 0 0 100vmax rgba(80, 80, 80, 0.7)",
          background: "gray",
          zIndex: 3,
        }}
      >
        <p
          className="centered-title"
          style={{
            top: 0,
            fontSize: 100,
            color: FONT_COLOR,
            textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            zIndex: 3,
          }}
        >
          You Have Died
        </p>
        <p
          className="centered-title"
          style={{
            top: 320,
            fontSize: 30,
            color: FONT_COLOR,
            textShadow: "-0.5px -0.5px 0 #000, 0.5px -0.5px 0 #000, -0.5px 0.5px 0 #000, 0.5px 0.5px 0 #000",
            zIndex: 3,
          }}
        >
          respawning in
        </p>
        <div
          className="centered-title"
          style={{
            top: 330,
            fontSize: 60,
            color: FONT_COLOR,
            textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
            zIndex: 3,
          }}
        >
          <CountdownCircleTimer
            isPlaying={true}
            duration={this.state.respawnTimer}
            colors={"#ffffff00"}
            trailColor="#ffffff00"
          >
            {({ remainingTime }) => remainingTime}
          </CountdownCircleTimer>
        </div>
      </div>
    ) : (
      <div />
    );
  }
}

export default DeathScreen;
