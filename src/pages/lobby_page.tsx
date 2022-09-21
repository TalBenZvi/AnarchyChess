import * as React from "react";
import { Redirect } from "react-router";

import NavBar from "../components/navbar";
import PlayerListComponent from "../components/player_list_component";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { Lobby } from "../database/database_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { BaseBot } from "../bots/base_bot";
import { RandomBot } from "../bots/random_bot";
import { PlayerList } from "../game_flow_util/player_list";
// import { TestBot } from "../bots/test_bot";
import LobbyCard from "../components/lobby_card";
import { User } from "../communication/communication_util";

import appIcon from "../assets/page_design/clean_app_icon.png";
// import { ServerFlowEngine } from "../server_side/server_flow_engine";
import { ClientActionCenter } from "../client_side/client_action_center";

const NUM_OF_RANDOM_BOTS: number = 2;

interface LobbyPageProps {
  lobby: Lobby;
  isHost: boolean;
  playerList: PlayerList;
  clientFlowEngine: ClientFlowEngine;
  // serverFlowEngine: ServerFlowEngine;
  onClose: () => void;
}

interface LobbyPageState {
  isBotDialogOpen: boolean;
  shouldRedirectToHome: boolean;
}

class LobbyPage extends React.Component<LobbyPageProps, LobbyPageState> {
  clientActionCenter: ClientActionCenter = ClientActionCenter.getInstance();
  state: LobbyPageState = {
    isBotDialogOpen: false,
    shouldRedirectToHome: false,
  };
  isGameStarting: boolean = false;
  private _isMounted: boolean = false;

  componentDidMount() {
    this._isMounted = true;
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  private async startGame() {
    // if (this.props.serverFlowEngine != null) {
    //   this.props.serverFlowEngine.startGame();
    // }
  }

  private fillwithBots = () => {
    // if (this.props.serverFlowEngine != null) {
    //   this.setState({ isBotDialogOpen: false });
    //   this.props.serverFlowEngine.kickAllBots();
    //   this.isGameStarting = true;
    //   let playerList = this.props.serverFlowEngine.players;
    //   let numOfRequiredBots = playerList.filter(
    //     (player: User) => player == null
    //   ).length;
    //   let bots: BaseBot[] = [...Array(numOfRequiredBots)].map((_, i) => {
    //     let user: User = {
    //       id: `BOT_${i}_${new Date().getTime()}`,
    //       username: `bot_${i + 1}`,
    //     };
    //     if (i < NUM_OF_RANDOM_BOTS) {
    //       return new RandomBot(user);
    //     } else {
    //       return new BaseBot(user);
    //     }
    //   });
    //   let nextAvailableBotIndex: number = 0;
    //   for (let i = 0; i < NUM_OF_PLAYERS; i++) {
    //     if (playerList[i] == null) {
    //       bots[nextAvailableBotIndex].attemptToConnect(this.props.lobby, i, {
    //         onFailure: () => {
    //           for (let bot of bots) {
    //             bot.disconnect();
    //           }
    //         },
    //       });
    //       nextAvailableBotIndex++;
    //     }
    //   }
    // }
  };

  render() {
    let {
      isHost,
      lobby,
      playerList,
      onClose,
      clientFlowEngine,
      // serverFlowEngine,
    } = this.props;
    let { isBotDialogOpen, shouldRedirectToHome } = this.state;
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
        <NavBar currentRoute={`/lobby/${lobby == null ? "" : lobby.id}`} />
        <div className="centered">
          <img
            alt=""
            src={appIcon}
            style={{
              width: 900,
              height: 900,
              filter: "opacity(0.03)",
            }}
          />
        </div>
        {/* player list */}
        <div
          style={{
            position: "absolute",
            left: 50,
            bottom: 50,
            transform: "translate(0%, 0%)",
          }}
        >
          <PlayerListComponent
            width={600}
            height={700}
            currentUser={this.clientActionCenter.currentUser}
            isHost={isHost}
            playerList={playerList}
          />
        </div>
        {/* lobby card */}
        <div
          style={{
            position: "absolute",
            right: 50,
            bottom: 180,
            transform: "translate(0%, 0%)",
          }}
        >
          <LobbyCard
            width={400}
            height={570}
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
              width: 190,
              height: 80,
              right: 50,
              bottom: 50,
              fontSize: 30,
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
              width: 190,
              height: 80,
              right: 455,
              bottom: 50,
              transform: "translate(100%, 0%)",
              fontSize: 20,
            }}
            onClick={() => {
              // serverFlowEngine.kickAllBots();
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
                  position: "relative",
                  width: 400,
                  height: 200,
                  zIndex: 3,
                  fontSize: 25,
                  textAlign: "center",
                  padding: 10,
                }}
                onClick={() => {}}
              >
                {`Your lobby only has ${numOfConnectedPlayers}/32 players. The rest of the spots will be filled by bots`}
                {/* cancel button */}
                <button
                  className="app-button"
                  style={{
                    position: "fixed",
                    left: 20,
                    bottom: 20,
                    width: 100,
                    height: 50,
                    fontSize: 20,
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
                    right: 20,
                    bottom: 20,
                    width: 100,
                    height: 50,
                    fontSize: 20,
                  }}
                  onClick={() => this.fillwithBots()}
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
