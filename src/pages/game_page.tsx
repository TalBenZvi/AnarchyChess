import React from "react";
import { withRouter } from "react-router";

import NavBar from "../components/navbar";
import GraveYard from "../components/graveyard";
import DeathScreen from "../components/death_screen";
import PromotionScreen from "../components/promotion_screen";
import GameStartScreen from "../components/game_start_screen";
import { PieceColor, NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { ServerFlowEngine } from "../server_side/server_flow_engine";
import ChessBoard from "../components/chess_board";
import { Authentication } from "../database/authentication";
import { BaseBot } from "../bots/base_bot";
import GameEndScreen from "../components/game_end_screen";
import ScoreBoard from "../components/scoreboard";

interface GamePageProps {}

interface GamePageState {
  windowWidth: number;
  windowHeight: number;
}

class GamePage extends React.Component<any, any> {
  state = {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };

  constructor(props: any) {
    super(props);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
  };

  render() {
    let { windowWidth, windowHeight } = this.state;
    let margin = 50;
    let boardSize: number = windowHeight * 0.85;
    let graveyardWidth: number = (windowWidth - boardSize) / 2 - 2 * margin;
    let graveyardHeight = boardSize * 0.985;
    return (
      /* background */
      <div className="background">
        <NavBar currentRoute={`/lobby/${this.props.match.params.id}`} />
        {/* board */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: "10%",
          }}
        >
          <ChessBoard
            size={boardSize}
            lightColor="#ff6666"
            darkColor="#353535"
            povColor={PieceColor.white}
            clientFlowEngine={Authentication.clientFlowEngine}
          />
        </div>
        {/* graveyard */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: 50,
          }}
        >
          <GraveYard
            width={graveyardWidth}
            height={graveyardHeight}
            tileColor="#808080"
            povColor={PieceColor.white}
            clientFlowEngine={Authentication.clientFlowEngine}
          />
        </div>
        {/* death screen */}
        <DeathScreen clientFlowEngine={Authentication.clientFlowEngine} />
        {/* promotion screen */}
        <PromotionScreen clientFlowEngine={Authentication.clientFlowEngine} />
        {/* game start screen */}
        <GameStartScreen clientFlowEngine={Authentication.clientFlowEngine} />
        {/* game end screen */}
        <GameEndScreen clientFlowEngine={Authentication.clientFlowEngine} />
        {/* scoreboard */}
        <div
          style={{
            position: "absolute",
            left: "5%",
            top: "15%",
          }}
        >
          <ScoreBoard
            width={350}
            height={220}
            clientFlowEngine={Authentication.clientFlowEngine}
          />
        </div>
      </div>
    );
  }
}

export default withRouter(GamePage);
