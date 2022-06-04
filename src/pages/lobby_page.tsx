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
import { User } from "../database/database_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { BaseBot } from "../bots/base_bot";
import { RandomBot } from "../bots/random_bot";
import { Authentication } from "../database/authentication";
import { PlayerList } from "../game_flow_util/player_list";

interface LobbyPageProps {}

interface LobbyPageState {
  playerList: PlayerList;
  isBotDialogOpen: boolean;
  shouldRedirectToHome: boolean;
  isGameStarting: boolean;
}

class LobbyPage
  extends React.Component<any, any>
  implements ClientFlowEngineObserver
{
  state: LobbyPageState = {
    playerList: null as any,
    isBotDialogOpen: false,
    shouldRedirectToHome: false,
    isGameStarting: false,
  };
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
      this.setState({ playerList: info.get(ClientEventInfo.playerList) });
    }
  }

  private startGame(): void {
    Authentication.serverFlowEngine.startGame();
  }

  private fillwithBots = async () => {
    this.setState({ isBotDialogOpen: false, isGameStarting: true });
    let playerList = Authentication.serverFlowEngine.players;
    let numOfRequiredBots = playerList.filter(
      (player: User) => player == null
    ).length;
    let bots: BaseBot[] = [...Array(numOfRequiredBots)].map(
      (_, i) =>
        new RandomBot({
          id: (i + 1).toString(),
          username: `bot_${i + 1}`,
        })
    );
    let nextAvailableBotIndex: number = 0;
    for (let i = 0; i < NUM_OF_PLAYERS; i++) {
      if (playerList[i] == null) {
        bots[nextAvailableBotIndex].attemptToConnect(
          Authentication.serverFlowEngine.gameID,
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
    let { playerList, isBotDialogOpen, shouldRedirectToHome, isGameStarting } =
      this.state;
    if (shouldRedirectToHome) {
      return <Redirect push to="/" />;
    }
    let numOfConnectedPlayers: number =
      playerList == null ? 0 : playerList.getConnectedUsers().length;
    if (numOfConnectedPlayers == NUM_OF_PLAYERS && isGameStarting) {
      this.startGame();
    }
    let isHost: boolean =
      Authentication.serverFlowEngine != null &&
      this.props.match.params.id === Authentication.serverFlowEngine.gameID;
    return (
      <div className="background">
        <NavBar currentRoute={`/lobby/${this.props.match.params.id}`} />
        {/* player list */}
        <div
          style={{
            position: "absolute",
            top: 110,
            left: 50,
          }}
        >
          <PlayerListComponent
            width={500}
            height={750}
            playerList={playerList}
          />
        </div>
        {/* leave / close lobby button */}
        <button
          className="app-button"
          style={{
            position: "absolute",
            width: 150,
            height: 50,
            left: 590,
            top: 110,
            fontSize: 20,
          }}
          onClick={() => {
            Authentication.leaveLobby();
            if (isHost) {
              Authentication.closeLobby();
            }
            this.setState({ shouldRedirectToHome: true });
          }}
        >
          {isHost ? "Close Lobby" : "Leave"}
        </button>
        {/* start game button */}
        {isHost ? (
          <button
            className="app-button"
            style={{
              position: "absolute",
              width: 200,
              height: 80,
              right: 50,
              bottom: 30,
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
