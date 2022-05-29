import * as React from "react";
import { withRouter, Redirect } from "react-router";

import { Authentication } from "../database/authentication";
import LobbyPage from "./lobby_page";
import {
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";

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
    lobbyState: LobbyState.open,
  };

  componentDidMount() {
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.addObserver(this);
    }
  }

  disconnect(): void {
    setTimeout(() => {
      this.setState({ lobbyState: LobbyState.closed });
    }, 4000);
    this.setState({ lobbyState: LobbyState.closing });
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    if (eventType === ClientEventType.disconnection) {
      this.disconnect();
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
