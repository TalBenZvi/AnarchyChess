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
import { PlayerList } from "../game_flow_util/player_list";

enum LobbyState {
  open,
  running,
  closing,
  closed,
}

interface ClientPageProps {}

interface ClientPageState {
  lobbyState: LobbyState;
  playerList: PlayerList;
}

class ClientPage
  extends React.Component<any, any>
  implements ClientFlowEngineObserver
{
  state = {
    lobbyState: LobbyState.open,
    playerList: null as any,
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
      case ClientEventType.playerListUpdate: {
        this.setState({ playerList: info.get(ClientEventInfo.playerList) });
        break;
      }
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
    let { lobbyState, playerList } = this.state;
    if (Authentication.currentUser == null) {
      return <Redirect push to="/" />;
    }
    let isHost: boolean =
      Authentication.serverFlowEngine != null &&
      this.props.match.params.id === Authentication.serverFlowEngine.lobby.id;
    return (
      <div className="background">
        {(() => {
          switch (lobbyState) {
            /* open for players */
            case LobbyState.open: {
              return (
                <LobbyPage
                  lobby={
                    Authentication.clientFlowEngine == null
                      ? (null as any)
                      : Authentication.clientFlowEngine.currentLobby
                  }
                  isHost={isHost}
                  playerList={playerList}
                  clientFlowEngine={Authentication.clientFlowEngine}
                  serverFlowEngine={
                    isHost ? Authentication.serverFlowEngine : (null as any)
                  }
                  onClose={() => {
                    Authentication.leaveLobby();
                    if (isHost) {
                      Authentication.closeLobby();
                    }
                  }}
                />
              );
            }
            /* game running */
            case LobbyState.running: {
              return (
                <GamePage
                  isHost={isHost}
                  playerList={playerList}
                  clientFlowEngine={Authentication.clientFlowEngine}
                  serverFlowEngine={
                    isHost ? Authentication.serverFlowEngine : (null as any)
                  }
                />
              );
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
      </div>
    );
  }
}

export default withRouter(ClientPage);
