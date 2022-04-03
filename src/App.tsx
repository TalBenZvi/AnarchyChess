import React from "react";
import "./App.css";
//import BoardComponent from "./components/chess_board";
//import { PieceColor, NUM_OF_PLAYERS } from "./game_flow_util/game_elements";
//import { ClientFlowEngine } from "./client_side/client_flow_engine";
//import { ServerFlowEngine } from "./server_side/server_flow_engine";

function App() {
  /*
  let serverFlowEngine: ServerFlowEngine = new ServerFlowEngine();
  let clientFlowEngines: ClientFlowEngine[] = [...Array(NUM_OF_PLAYERS)].map(
    (_, i) => new ClientFlowEngine()
  );
  */
 return <h1>hello</h1>
 /*
  return (
    <div className="centered">
      <BoardComponent
        size={850}
        lightColor="#9999bb"
        darkColor="#454545"
        povColor={PieceColor.white}
        clientFlowEngine={new ClientFlowEngine()}
      />
  
      <button
        onClick={() => {
          serverFlowEngine.acceptConnections(8000, "127.0.0.1");
          for (let clientFlowEngine of clientFlowEngines) {
            clientFlowEngine.connect(8000, "127.0.0.1");
          }
        }}
      >
        start
      </button>
    </div>
  );
  */
}

export default App;
