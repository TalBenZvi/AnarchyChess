import React from "react";
import "./App.css";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import HomePage from "./pages/home_page";
import ClientPage from "./pages/client_page";
import { ClientActionCenter } from "./client_side/client_action_center";
import {
  Environment,
  EnvironmentManager,
  WEBSITE_DOMAIN,
} from "./communication/communication_util";

function App() {
  if (window.location.host === WEBSITE_DOMAIN) {
    EnvironmentManager.environment = Environment.production;
  } else {
    EnvironmentManager.environment = Environment.development;
  }
  ClientActionCenter.getInstance();
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
