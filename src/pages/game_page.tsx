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

interface GamePageProps {}

interface GamePageState {}

class GamePage extends React.Component<any, any> {
  state = {};

  /*
  constructor(gamePageProps: any) {
    super(gamePageProps);
    
    Authentication.serverFlowEngine = new ServerFlowEngine();
    Authentication.serverFlowEngine.acceptConnections("testGameID");
    Authentication.clientFlowEngine = new ClientFlowEngine(
      Authentication.currentUser
    );
    Authentication.clientFlowEngine.attemptToConnect("testGameID", 0, {});

    for (let i = 1; i < 20; i++) {
      let bot = new BaseBot({
        id: i.toString(),
        username: `bot_${i}`,
      });
      bot.attemptToConnect(Authentication.serverFlowEngine.gameID, i, {});
    }
    console.log("here1");
    setTimeout(() => console.log("here2"), 10000);
  }
  */

  render() {
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
            size={800}
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
            left: "80%",
          }}
        >
          <GraveYard
            width={500}
            height={800}
            backgroundColor="#454545"
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
        {/*temp*/}
        <button
          className="small-button"
          style={{
            position: "absolute",
            left: 100,
            top: 500,
            width: 200,
            height: 100,
          }}
          onClick={() => {
            Authentication.serverFlowEngine.endGame(PieceColor.white);
          }}
        >
          White Win
        </button>
        <button
          className="small-button"
          style={{
            position: "absolute",
            left: 100,
            top: 650,
            width: 200,
            height: 100,
          }}
          onClick={() => {
            Authentication.serverFlowEngine.endGame(PieceColor.black);
          }}
        >
          Black Win
        </button>
        <button
          className="small-button"
          style={{
            position: "absolute",
            left: 100,
            top: 800,
            width: 200,
            height: 100,
          }}
          onClick={() => {
            Authentication.serverFlowEngine.startGame();
          }}
        >
          Restart
        </button>
      </div>
    );
  }
}

export default withRouter(GamePage);
