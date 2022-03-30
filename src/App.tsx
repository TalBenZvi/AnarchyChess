import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";
import TestComponent from "./components/test_component";
import { PieceColor } from "./game_flow_util/game_elements";
import { ClientFlowEngine } from "./client_side/client_flow_engine";

function App() {
  let clientFlowEngine: ClientFlowEngine = new ClientFlowEngine();
  return (
    <div className="centered">
      <BoardComponent size={850} lightColor="#9999bb" darkColor="#333333" povColor={PieceColor.white} clientFlowEngine={clientFlowEngine} />
      <button onClick={()=>{
        clientFlowEngine.test();
      }}>
        start
      </button>
    </div>
    
  );
}

export default App;
