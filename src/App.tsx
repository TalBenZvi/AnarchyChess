import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import HomePage from "./pages/home_page";
import ClientPage from "./pages/client_page";

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
      </Switch>
    </Router>
  );
}

export default App;
