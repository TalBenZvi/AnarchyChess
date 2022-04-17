import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";
import DeathScreen from "./components/death_screen";
import GraveYard from "./components/graveyard";

import { PieceColor, Move } from "./game_flow_util/game_elements";
import { ClientFlowEngine } from "./client_side/client_flow_engine";
import { ServerFlowEngine } from "./server_side/server_flow_engine";

//import { GameClient } from "./client_side/game_client";
//import { GameServer } from "./server_side/game_server";

//import { Event, EventInfo, EventType } from "./game_flow_util/communication";

//import TestComponent from "./components/test_component"

function App() {
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(3)].map(
    (_, i) => new ClientFlowEngine(`id${i}`)
  );
  /*
  return (
    <div
      style={{
        backgroundColor: 'blue',
        width: '100px',
        height: '100px'
      }}
    />
  );
  */
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "#222222",
        width: "100%",
        height: "100%",
      }}
    >
      <div className="centered">
        <BoardComponent
          size={850}
          lightColor="#9999bb"
          darkColor="#454545"
          povColor={PieceColor.white}
          clientFlowEngine={clientFlowEngines[0]}
        />
      </div>
      <button
          style={{ color: "white", margin: 20}}
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
          style={{ color: "white", margin: 20 }}
          onClick={async () => {
            clientFlowEngines[1].sendMove(new Move(5, 4));
            await new Promise((f) => setTimeout(f, 1000));
            while (true) {
              clientFlowEngines[2].sendMove(new Move(2, 0));
              await new Promise((f) => setTimeout(f, 1000));
              clientFlowEngines[2].sendMove(new Move(7, 5));
              await new Promise((f) => setTimeout(f, 1000));
            }
          }}
        >
          test
        </button>
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
          clientFlowEngine={clientFlowEngines[0]}
        />
      </div>
      <DeathScreen clientFlowEngine={clientFlowEngines[0]} />
    </div>
  );

  return <h1>Hello</h1>;
}

export default App;
