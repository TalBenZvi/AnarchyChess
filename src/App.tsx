import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";
import { PieceColor } from "./game_flow_util/game_elements";

function App() {
  return (
    <div className="centered">
      <BoardComponent size={850} lightColor="#9999bb" darkColor="#333333" povColor={PieceColor.white}/>
    </div>
  );
}

export default App;
