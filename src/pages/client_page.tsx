import * as React from "react";
import { withRouter, Redirect } from "react-router";

import { Authentication } from "../database/authentication";
import LobbyPage from "./lobby_page";
import NavBar from "../components/navbar";
import PlayerList from "../components/player_list";
import { ClientPageComponent } from "../components/game_component_interfaces";

enum LobbyState {
  open,
  running,
  closing,
  closed,
}

interface ClientPageProps {}

interface ClientPageState {
  lobbyState: LobbyState;
}

class ClientPage
  extends React.Component<ClientPageProps, ClientPageState>
  implements ClientPageComponent {
  state = {
    lobbyState: LobbyState.open,
  };

  componentDidMount() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.clientPage = this;
    }
  }

  disconnect(): void {
    setTimeout(() => {
      this.setState({ lobbyState: LobbyState.closed });
    }, 4000);
    this.setState({ lobbyState: LobbyState.closing });
  }

  render() {
    let { lobbyState } = this.state;
    if (Authentication.currentUser == null) {
      return <Redirect push to="/" />;
    }
    return (
      <div className="background">
        {(() => {
          switch (lobbyState) {
            case LobbyState.open: {
              return (
                <LobbyPage clientFlowEngine={Authentication.clientFlowEngine} />
              );
            }
            case LobbyState.running: {
              return <div />;
            }
            case LobbyState.closing: {
              return (
                <div
                  className="dialog"
                  style={{
                    zIndex: 0,
                  }}
                >
                  <div
                    className="centered-title"
                    style={{
                      top: "45%",
                      zIndex: 2,
                      fontSize: 50,
                    }}
                  >
                    Disconnected from host, returning to home...
                  </div>
                </div>
              );
            }
            case LobbyState.closed: {
              return <Redirect push to="/" />;
            }
          }
        })()}
      </div>
    );
  }
}

export default ClientPage;
