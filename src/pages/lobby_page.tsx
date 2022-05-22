import * as React from "react";
import { withRouter } from "react-router";

import { Authentication } from "../database/authentication";
import NavBar from "../components/navbar";
import PlayerList from "../components/player_list";

interface LobbyPageProps {}

interface LobbyPageState {}

class LobbyPage extends React.Component<any, any> {
  state = {};

  componentDidMount() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.attemptToConnect(
        this.props.match.params.id
      );
    }
  }

  render() {
    return (
      <div className="background">
        <NavBar currentRoute={`/lobby/${this.props.match.params.id}`} />
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 50,
          }}
        >
          <PlayerList
            width={500}
            height={750}
            clientFlowEngine={Authentication.clientFlowEngine}
          />
        </div>
      </div>
    );
  }
}

export default withRouter(LobbyPage);
