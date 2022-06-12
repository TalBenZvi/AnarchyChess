import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import GamePage from "./pages/game_page";
import HomePage from "./pages/home_page";
import ClientPage from "./pages/client_page";
import TestPage from "./pages/test_page";

import { shuffle } from "./game_flow_util/communication";
import { Position } from "./game_flow_util/game_elements";

function App() {
  return (
    <Router>
      <Switch>
        <Route path="/" exact>
          <HomePage />
        </Route>
        <Route path="/lobby/:id" exact>
          <ClientPage />
        </Route>
        <Route path="/test" exact>
          <TestPage />
        </Route>
      </Switch>
    </Router>
  );
}

export default App;
