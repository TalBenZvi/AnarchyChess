import React from "react";
import "./App.css";
import GamePage from "./pages/game_page";
import HomePage from "./pages/home_page";
import TestPage from "./pages/test_page";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <HomePage />
        </Route>
        <Route path="/game" exact>
          <GamePage />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
