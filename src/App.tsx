import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";
import GraveYard from "./components/graveyard";
import DeathScreen from "./components/death_screen";
import PromotionScreen from "./components/promotion_screen";

import { PieceColor, Move } from "./game_flow_util/game_elements";
import { ClientFlowEngine } from "./client_side/client_flow_engine";
import { ServerFlowEngine } from "./server_side/server_flow_engine";
import TestComponent from "./components/test_component";
import TestCanvas from "./components/test_canvas"

//import { GameClient } from "./client_side/game_client";
//import { GameServer } from "./server_side/game_server";

//import { Event, EventInfo, EventType } from "./game_flow_util/communication";

//import TestComponent from "./components/test_component"

function App() {
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(4)].map(
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
      {/*}
      <div className="centered">
        <BoardComponent
          size={850}
          lightColor="#9999bb"
          darkColor="#454545"
          povColor={PieceColor.white}
          clientFlowEngine={clientFlowEngines[0]}
        />
    </div>*/}
      <div className="centered">
        <TestComponent
          size={850}
          lightColor="#9999bb"
          darkColor="#454545"
          povColor={PieceColor.white}
          clientFlowEngine={clientFlowEngines[0]}
        />
      </div>
      {/* buttons */}
      <button
        style={{ color: "white", margin: 20 }}
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
      <div />
      <button
        style={{ color: "white", margin: 20 }}
        onClick={async () => {
          clientFlowEngines[1].sendMove(new Move(3, 4));
          await new Promise((f) => setTimeout(f, 500));
          clientFlowEngines[2].sendMove(new Move(3, 2));
          clientFlowEngines[3].sendMove(new Move(2, 5));
        }}
      >
        test
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
          clientFlowEngine={clientFlowEngines[0]}
        />
      </div>
      {/* death screen */}
      <DeathScreen clientFlowEngine={clientFlowEngines[0]} />
      {/* promotion screen */}
      <PromotionScreen clientFlowEngine={clientFlowEngines[0]} />
    </div>
  );
}

export default App;
