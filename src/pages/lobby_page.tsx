import * as React from "react";
import { withRouter } from "react-router";
import { Redirect } from "react-router";

import NavBar from "../components/navbar";
import PlayerListComponent from "../components/player_list_component";
import {
  ClientFlowEngineObserver,
  ClientEventType,
  ClientEventInfo,
} from "../client_side/client_flow_engine";
import { Lobby, User } from "../database/database_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { BaseBot } from "../bots/base_bot";
import { RandomBot } from "../bots/random_bot";
import { Authentication } from "../database/authentication";
import { PlayerList } from "../game_flow_util/player_list";
import { TestBot } from "../bots/test_bot";
import LobbyCard from "../components/lobby_card";

import appIcon from "../assets/page_design/clean_app_icon.png";

const NUM_OF_RANDOM_BOTS: number = 3;

interface LobbyPageProps {}

interface LobbyPageState {
  playerList: PlayerList;
  isBotDialogOpen: boolean;
  shouldRedirectToHome: boolean;
}

class LobbyPage
  extends React.Component<any, any>
  implements ClientFlowEngineObserver
{
  state: LobbyPageState = {
    playerList: null as any,
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

  constructor(props: any) {
    super(props);
    if (Authentication.clientFlowEngine != null) {
      Authentication.clientFlowEngine.addObserver(this);
    }
  }

  notify(eventType: ClientEventType, info: Map<ClientEventInfo, any>): void {
    if (eventType === ClientEventType.playerListUpdate && this._isMounted) {
      let playerList: PlayerList = info.get(ClientEventInfo.playerList);
      let numOfConnectedPlayers: number =
        playerList == null ? 0 : playerList.getConnectedUsers().length;
      if (numOfConnectedPlayers == NUM_OF_PLAYERS && this.isGameStarting) {
        this.startGame();
      }
      this.setState({ playerList: playerList });
    }
  }

  private startGame(): void {
    Authentication.serverFlowEngine.startGame();
  }

  private fillwithBots = async () => {
    this.setState({ isBotDialogOpen: false });
    this.isGameStarting = true;
    let playerList = Authentication.serverFlowEngine.players;
    let numOfRequiredBots = playerList.filter(
      (player: User) => player == null
    ).length;
    let bots: BaseBot[] = [...Array(numOfRequiredBots)].map((_, i) => {
      let user: User = {
        id: (i + 1).toString(),
        username: `bot_${i + 1}`,
      };
      if (i < NUM_OF_RANDOM_BOTS) {
        return new RandomBot(user);
      } else {
        return new BaseBot(user);
      }
    });
    let nextAvailableBotIndex: number = 0;
    for (let i = 0; i < NUM_OF_PLAYERS; i++) {
      if (playerList[i] == null) {
        bots[nextAvailableBotIndex].attemptToConnect(
          Authentication.serverFlowEngine.lobby,
          i,
          {
            onFailure: () => {
              for (let bot of bots) {
                bot.disconnect();
              }
            },
          }
        );
        nextAvailableBotIndex++;
      }
    }
  };

  render() {
    let { playerList, isBotDialogOpen, shouldRedirectToHome } = this.state;
    if (shouldRedirectToHome) {
      return <Redirect push to="/" />;
    }
    let numOfConnectedPlayers: number =
      playerList == null ? 0 : playerList.getConnectedUsers().length;
    let lobby: Lobby =
      Authentication.clientFlowEngine == null
        ? (null as any)
        : Authentication.clientFlowEngine.currentLobby;
    let isHost: boolean =
      Authentication.serverFlowEngine != null &&
      this.props.match.params.id === Authentication.serverFlowEngine.lobby.id;
    return (
      <div className="background">
        <NavBar currentRoute={`/lobby/${this.props.match.params.id}`} />
        <div className="centered">
          <img
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
            playerList={playerList}
            isHost={isHost}
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
              Authentication.leaveLobby();
              if (isHost) {
                Authentication.closeLobby();
              }
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
              width: 200,
              height: 80,
              right: 50,
              bottom: 50,
              fontSize: 30,
            }}
            onClick={() => {
              if (numOfConnectedPlayers == NUM_OF_PLAYERS) {
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

export default withRouter(LobbyPage);
