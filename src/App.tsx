import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";
import {
  PieceColor,
  NUM_OF_PLAYERS,
  Move,
} from "./game_flow_util/game_elements";
import { ClientFlowEngine } from "./client_side/client_flow_engine";
import { ServerFlowEngine } from "./server_side/server_flow_engine";

import { GameClient } from "./client_side/game_client";
import { GameServer } from "./server_side/game_server";

import { Event, EventInfo, EventType } from "./game_flow_util/communication";

//import TestComponent from "./components/test_component"

function App() {
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(1)].map(
    (_, i) => new ClientFlowEngine(`id${i}`)
  );
  return (
    <div className="centered">
      <BoardComponent
        size={850}
        lightColor="#9999bb"
        darkColor="#454545"
        povColor={PieceColor.white}
        clientFlowEngine={clientFlowEngines[0]}
      />

      <button
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
    </div>
  );

  return <h1>Hello</h1>;
}

export default App;
