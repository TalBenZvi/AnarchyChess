import * as React from "react";
import { Redirect } from "react-router";

import NavBar from "../components/navbar";
import PlayerListComponent from "../components/player_list_component";
import { Lobby } from "../communication/communication_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { PlayerList } from "../game_flow_util/player_list";
import LobbyCard from "../components/lobby_card";

import appIcon from "../assets/page_design/clean_app_icon.png";
import { ClientActionCenter } from "../client_side/client_action_center";

interface LobbyPageProps {
  lobby: Lobby;
  isHost: boolean;
  playerList: PlayerList;
  onClose: () => void;
}

interface LobbyPageState {
  isBotDialogOpen: boolean;
  shouldRedirectToHome: boolean;
  windowWidth: number;
  windowHeight: number;
}

class LobbyPage extends React.Component<LobbyPageProps, LobbyPageState> {
  clientActionCenter: ClientActionCenter = ClientActionCenter.getInstance();
  state: LobbyPageState = {
    isBotDialogOpen: false,
    shouldRedirectToHome: false,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };
  isGameStarting: boolean = false;
  private _isMounted: boolean = false;

  componentDidMount() {
    this._isMounted = true;
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
    this._isMounted = false;
  }

  updateWindowDimensions = () => {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
  };

  private async startGame() {
    this.clientActionCenter.startGame();
  }

  render() {
    let { isHost, lobby, playerList, onClose } = this.props;
    let { isBotDialogOpen, shouldRedirectToHome, windowWidth, windowHeight } =
      this.state;
    if (shouldRedirectToHome) {
      return <Redirect push to="/" />;
    }
    let numOfConnectedPlayers: number =
      playerList == null ? 0 : playerList.getConnectedUsers().length;
    if (numOfConnectedPlayers === NUM_OF_PLAYERS && this.isGameStarting) {
      this.startGame();
    }
    return (
      <div className="background">
        <NavBar
          currentRoute={`/lobby/${lobby == null ? "" : lobby.creatorID}`}
        />
        {/* background image */}
        <div className="centered">
          <img
            alt=""
            src={appIcon}
            style={{
              width: windowHeight * 0.9,
              height: windowHeight * 0.9,
              filter: "opacity(0.03)",
            }}
          />
        </div>
        {/* player list */}
        <div
          style={{
            position: "absolute",
            left: "2%",
            bottom: "5%",
            transform: "translate(0%, 0%)",
          }}
        >
          <PlayerListComponent
            width={windowWidth * 0.3}
            height={windowHeight * 0.8}
            currentUser={this.clientActionCenter.currentUser}
            isHost={isHost}
            playerList={playerList}
          />
        </div>
        {/* lobby card */}
        <div
          style={{
            position: "absolute",
            right: "2%",
            bottom: "20%",
          }}
        >
          <LobbyCard
            width={windowWidth * 0.218}
            height={windowHeight * 0.65}
            lobby={lobby}
            isHost={isHost}
            onClose={() => {
              onClose();
              this.setState({ shouldRedirectToHome: true });
            }}
          />
        </div>
        {/* start game button */}
        {isHost ? (
          <button
            className="app-button"
            style={{
              position: "absolute",
              width: windowWidth * 0.1,
              height: windowHeight * 0.1,
              right: "2%",
              bottom: "5%",
              fontSize: "1.4vw",
            }}
            onClick={() => {
              if (numOfConnectedPlayers === NUM_OF_PLAYERS) {
                this.startGame();
              } else {
                this.setState({ isBotDialogOpen: true });
              }
            }}
          >
            Start Game
          </button>
        ) : (
          <div />
        )}
        {/* disconnect bots button */}
        {isHost ? (
          <button
            className="app-button"
            style={{
              position: "absolute",
              width: windowWidth * 0.1,
              height: windowHeight * 0.1,
              right: "14%",
              bottom: "5%",
              fontSize: "1.4vw",
            }}
            onClick={() => {
              this.clientActionCenter.removeBotsFromLobby();
            }}
          >
            Disconnect All Bots
          </button>
        ) : (
          <div />
        )}
        {/* bot dialog */}
        {isBotDialogOpen ? (
          <div>
            <button
              className="dialog"
              style={{
                position: "absolute",
                zIndex: 0,
              }}
              onClick={() => this.setState({ isBotDialogOpen: false })}
            />
            <div className="centered">
              <div
                className="highlighted-area"
                style={{
                  position: "absolute",
                  width: windowWidth * 0.2,
                  height: windowHeight * 0.2,
                  zIndex: 3,
                  fontSize: "1.2vw",
                  textAlign: "center",
                  padding: windowWidth * 0.01,
                  transform: "translate(-50%, -50%)",
                }}
                onClick={() => {}}
              >
                {`Your lobby only has ${numOfConnectedPlayers}/32 players. The rest of the spots will be filled by bots`}
                {/* cancel button */}
                <button
                  className="app-button"
                  style={{
                    position: "fixed",
                    left: "5%",
                    bottom: "10%",
                    width: windowWidth * 0.065,
                    height: windowHeight * 0.06,
                    fontSize: "1.2vw",
                  }}
                  onClick={() => this.setState({ isBotDialogOpen: false })}
                >
                  Cancel
                </button>
                {/* confirm button */}
                <button
                  className="app-button"
                  style={{
                    position: "fixed",
                    right: "5%",
                    bottom: "10%",
                    width: windowWidth * 0.065,
                    height: windowHeight * 0.06,
                    fontSize: "1.2vw",
                  }}
                  onClick={() => {
                    this.isGameStarting = true;
                    this.clientActionCenter.fillLobbyWithBots();
                    this.setState({ isBotDialogOpen: false });
                  }}
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default LobbyPage;
