import * as React from "react";
import { withRouter } from "react-router";

import NavBar from "../components/navbar";
import PlayerList from "../components/player_list";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

interface LobbyPageProps {
  clientFlowEngine: ClientFlowEngine;
}

interface LobbyPageState {}

class LobbyPage extends React.Component<any, any> {
  state = {};

  
  render() {
    let { clientFlowEngine } = this.props;
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
            clientFlowEngine={clientFlowEngine}
          />
        </div>
      </div>
    );
  }
}

export default withRouter(LobbyPage);
