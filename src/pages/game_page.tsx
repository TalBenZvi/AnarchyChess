import React from "react";
import GraveYard from "../components/graveyard";
import DeathScreen from "../components/death_screen";
import PromotionScreen from "../components/promotion_screen";

import { PieceColor, NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { ServerFlowEngine } from "../server_side/server_flow_engine";
import ChessBoard from "../components/chess_board";

const PLAYER_ENGINE_INDEX: number = 11;

function GamePage() {
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(NUM_OF_PLAYERS)].map(
    (_, i) => new ClientFlowEngine(`id${i}`)
  );
  let isRunning: boolean = true;
  return (
    /* background */
    <div
      style={{
        position: "absolute",
        backgroundColor: "#222222",
        width: "100%",
        height: "100%",
      }}
    >
      {/* board */}
      <div className="centered">
        <ChessBoard
          size={850}
          lightColor="#9999bb"
          darkColor="#454545"
          povColor={PieceColor.white}
          clientFlowEngine={clientFlowEngines[PLAYER_ENGINE_INDEX]}
        />
      </div>
      {/* buttons */}
      <button
        style={{
          margin: 20,
          background: "none",
          color: "white",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
          outline: "inherit",
        }}
        onClick={() => {
          let gameID: string = Math.random().toString();
          serverFlowEngine.acceptConnections(gameID);
          for (let clientFlowEngine of clientFlowEngines) {
            clientFlowEngine.attemptToConnect("localhost", gameID);
          }
        }}
      >
        start
      </button>
      <br/>
      <button
        style={{
          margin: 20,
          background: "none",
          color: "white",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
          outline: "inherit",
        }}
        onClick={async () => {
          let i: number = 0;
          while (isRunning) {
            if (i !== PLAYER_ENGINE_INDEX) {
              clientFlowEngines[i].runTest();
              if (clientFlowEngines[i].shouldStopSimulation) {
                isRunning = false;
              }
              await new Promise((f) => setTimeout(f, 100));
            }
            i = (i + 1) % NUM_OF_PLAYERS;
          }
        }}
      >
        test
      </button>
      <br/>
      <button
        style={{
          margin: 20,
          background: "none",
          color: "white",
          border: "none",
          padding: 0,
          font: "inherit",
          cursor: "pointer",
          outline: "inherit",
        }}
        onClick={() => {
          isRunning = false;
        }}
      >
        stop
      </button>
      {/* graveyard */}
      <div
        style={{
          position: "absolute",
          left: 1405,
          top: "50%",
          transform: "translate(0, -50%)",
        }}
      >
        <GraveYard
          width={500}
          height={850}
          backgroundColor="#454545"
          tileColor="#808080"
          povColor={PieceColor.white}
          clientFlowEngine={clientFlowEngines[PLAYER_ENGINE_INDEX]}
        />
      </div>
      {/* death screen */}
      <DeathScreen clientFlowEngine={clientFlowEngines[PLAYER_ENGINE_INDEX]} />
      {/* promotion screen */}
      <PromotionScreen
        clientFlowEngine={clientFlowEngines[PLAYER_ENGINE_INDEX]}
      />
    </div>
  );
}

export default GamePage;
