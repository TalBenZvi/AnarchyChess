import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";
import {
  PieceColor,
  Move,
} from "./game_flow_util/game_elements";
import { ClientFlowEngine } from "./client_side/client_flow_engine";
import { ServerFlowEngine } from "./server_side/server_flow_engine";

//import { GameClient } from "./client_side/game_client";
//import { GameServer } from "./server_side/game_server";

//import { Event, EventInfo, EventType } from "./game_flow_util/communication";

//import TestComponent from "./components/test_component"

function App() {
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(6)].map(
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
      <div></div>
      <button
        onClick={async () => {
          clientFlowEngines[4].sendMove(new Move(3, 3));
          await new Promise((f) => setTimeout(f, 1000));
          clientFlowEngines[1].sendMove(new Move(2, 2));
          clientFlowEngines[2].sendMove(new Move(3, 5));
          clientFlowEngines[3].sendMove(new Move(2, 3));
          /*
          await new Promise((f) => setTimeout(f, 1000));
          
          clientFlowEngines[5].sendMove(new Move(0, 2));
          await new Promise((f) => setTimeout(f, 500));
          clientFlowEngines[5].sendMove(new Move(0, 0));
          */
        }}
      >
        test
      </button>
    </div>
  );

  return <h1>Hello</h1>;
}

export default App;
