import React from "react";
import "./App.css";
import BoardComponent from "./components/chess_board";

function App() {
  return (
    <div className="App">
      <div className="row">
        <BoardComponent size={500} lightColor="#ffffff" darkColor="#000000" />
        <BoardComponent size={500} lightColor="#ffffff" darkColor="#000000" />
      </div>
    </div>
  );
}

export default App;
