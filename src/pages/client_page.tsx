import * as React from "react";
import { withRouter, Redirect } from "react-router";

import { Authentication } from "../database/authentication";
import LobbyPage from "./lobby_page";
import GamePage from "./game_page";

import {
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";
import GameEndScreen from "../components/game_end_screen";

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
  implements ClientFlowEngineObserver
{
  state = {
    lobbyState: LobbyState.running,
  };

  componentDidMount() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.addObserver(this);
    }
  }

  componentWillUnmount() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.removeObserver(this);
    }
  }

  disconnect(): void {
    setTimeout(() => {
      this.setState({ lobbyState: LobbyState.closed });
    }, 4000);
    this.setState({ lobbyState: LobbyState.closing });
  }

  startGame(): void {
    this.setState({ lobbyState: LobbyState.running });
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.disconnection: {
        this.disconnect();
        break;
      }
      case ClientEventType.roleAssigned: {
        this.setState({ lobbyState: LobbyState.running });
        break;
      }
    }
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
            /* open for players */
            case LobbyState.open: {
              return <LobbyPage />;
            }
            /* game running */
            case LobbyState.running: {
              return <GamePage />;
            }
            /* lobby closing */
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
            /* closed */
            case LobbyState.closed: {
              return <Redirect push to="/" />;
            }
          }
        })()}
        {/* temp */}
        {/* <GameEndScreen clientFlowEngine={Authentication.clientFlowEngine} /> */}
      </div>
    );
  }
}

export default ClientPage;
