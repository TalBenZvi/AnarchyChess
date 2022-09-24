import * as React from "react";
import { withRouter, Redirect } from "react-router";

import LobbyPage from "./lobby_page";
import GamePage from "./game_page";
import {
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";
import { PlayerList } from "../game_flow_util/player_list";
import { ClientActionCenter } from "../client_side/client_action_center";

enum LobbyState {
  open,
  running,
  closing,
  closed,
}

interface ClientPageState {
  lobbyState: LobbyState;
  playerList: PlayerList;
}

class ClientPage
  extends React.Component<any, any>
  implements ClientFlowEngineObserver
{
  // clientActionCenter: ClientActionCenter = ClientActionCenter.getInstance();
  state: ClientPageState = {
    lobbyState: LobbyState.open,
    playerList: null as any,
  };

  componentDidMount() {
    let clientActionCenter = ClientActionCenter.getInstance();
    if (clientActionCenter.clientFlowEngine !== null) {
      clientActionCenter.clientFlowEngine.addObserver(this);
      this.setState({
        playerList: clientActionCenter.clientFlowEngine.playerList,
      });
    }
  }

  componentWillUnmount() {
    let clientActionCenter = ClientActionCenter.getInstance();
    if (clientActionCenter.clientFlowEngine !== null) {
      clientActionCenter.clientFlowEngine.removeObserver(this);
    }
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    switch (eventType) {
      case ClientEventType.playerListUpdate: {
        this.setState({ playerList: info.get(ClientEventInfo.playerList) });
        break;
      }
      case ClientEventType.disconnectedFromLobby: {
        this.setState({ lobbyState: LobbyState.closing });
        break;
      }
      case ClientEventType.roleAssigned: {
        this.setState({ lobbyState: LobbyState.running });
        break;
      }
      case ClientEventType.returnToLobby: {
        this.setState({ lobbyState: LobbyState.open });
        break;
      }
    }
  }

  render() {
    let { lobbyState, playerList } = this.state;
    let clientActionCenter = ClientActionCenter.getInstance();
    if (
      clientActionCenter.currentUser == null ||
      clientActionCenter.currentLobby == null
    ) {
      return <Redirect push to="/" />;
    }
    let isHost: boolean =
      clientActionCenter.currentUser.id ===
      clientActionCenter.currentLobby.creatorID;
    return (
      <div className="background">
        {(() => {
          switch (lobbyState) {
            // open for players
            case LobbyState.open: {
              return (
                <LobbyPage
                  lobby={clientActionCenter.currentLobby}
                  isHost={isHost}
                  playerList={playerList}
                  clientFlowEngine={clientActionCenter.clientFlowEngine}
                  onClose={() => {
                    clientActionCenter.leaveLobby();
                  }}
                />
              );
            }
            // game running
            case LobbyState.running: {
              return (
                <GamePage
                  lobby={clientActionCenter.currentLobby}
                  isHost={isHost}
                  playerList={playerList}
                  clientFlowEngine={clientActionCenter.clientFlowEngine}
                />
              );
            }
            // lobby closing
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
                      top: "30%",
                      zIndex: 2,
                      fontSize: 50,
                    }}
                  >
                    Disconnected From Host
                  </div>
                  <button
                    className="app-button"
                    style={{
                      position: "absolute",
                      top: "60%",
                      transform: "translate(-50%, -50%)",
                      left: "50%",
                      zIndex: 2,
                      width: 250,
                      height: 70,
                      fontSize: 25,
                    }}
                    onClick={() => {
                      this.setState({ lobbyState: LobbyState.closed });
                    }}
                  >
                    Return to Home
                  </button>
                </div>
              );
            }
            // closed
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
