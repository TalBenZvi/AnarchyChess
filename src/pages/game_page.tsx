import React from "react";

import NavBar from "../components/navbar";
import GraveYard from "../components/graveyard";
import DeathScreen from "../components/death_screen";
import PromotionScreen from "../components/promotion_screen";
import GameStartScreen from "../components/game_start_screen";
import { PieceColor, NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { ServerFlowEngine } from "../server_side/server_flow_engine";
import ChessBoard from "../components/chess_board";
import { BaseBot } from "../bots/base_bot";
import GameEndScreen from "../components/game_end_screen";
import ScoreBoard from "../components/scoreboard";
import PlayerListComponent from "../components/player_list_component";
import { PlayerList } from "../game_flow_util/player_list";
import { Lobby } from "../database/database_util";

import exitIcon from "../assets/page_design/exit_icon.png";
import { SoundEffectsPlayer } from "../components/sound_effects_player";

interface GamePageProps {
  lobby: Lobby;
  isHost: boolean;
  playerList: PlayerList;
  clientFlowEngine: ClientFlowEngine;
  serverFlowEngine: ServerFlowEngine;
}

interface GamePageState {
  windowWidth: number;
  windowHeight: number;
}

class GamePage extends React.Component<GamePageProps, GamePageState> {
  state = {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };
  private soundEffectsPlayer: SoundEffectsPlayer = null as any;

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    this.soundEffectsPlayer = new SoundEffectsPlayer(
      this.props.clientFlowEngine
    );
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
  };

  render() {
    let { lobby, playerList, isHost, clientFlowEngine, serverFlowEngine } =
      this.props;
    let { windowWidth, windowHeight } = this.state;

    let margin = 50;

    let boardSize: number = windowHeight * 0.85;

    let graveyardWidth: number = (windowWidth - boardSize) / 2 - 2 * margin;
    let graveyardHeight = boardSize * 0.985;

    let scoreBoardWidth: number = graveyardWidth;
    let scoreBoardHeight: number = 220;

    let playerListWidth: number = graveyardWidth;
    let playerListHeight: number = boardSize - scoreBoardHeight - margin;

    let exitButtonSize: number = 50;

    return (
      /* background */
      <div className="background">
        <NavBar
          currentRoute={`/lobby/${
            clientFlowEngine == null || clientFlowEngine.currentLobby == null
              ? ""
              : clientFlowEngine.currentLobby.id
          }`}
        />
        {/* board */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: "10%",
          }}
        >
          <ChessBoard
            size={boardSize}
            lightColor="#ff6666"
            darkColor="#353535"
            povColor={PieceColor.white}
            clientFlowEngine={clientFlowEngine}
          />
        </div>
        {/* graveyard */}
        <div
          style={{
            position: "absolute",
            top: "10%",
            right: 50,
          }}
        >
          <GraveYard
            width={graveyardWidth}
            height={graveyardHeight}
            tileColor="#808080"
            povColor={PieceColor.white}
            clientFlowEngine={clientFlowEngine}
          />
        </div>
        {/* death screen */}
        <DeathScreen clientFlowEngine={clientFlowEngine} />
        {/* promotion screen */}
        <PromotionScreen clientFlowEngine={clientFlowEngine} />
        {/* game start screen */}
        <GameStartScreen clientFlowEngine={clientFlowEngine} />
        {/* game end screen */}
        <GameEndScreen clientFlowEngine={clientFlowEngine} />
        {/* scoreboard */}
        {lobby != null && lobby.areTeamsPrearranged ? (
          <div
            style={{
              position: "absolute",
              left: graveyardWidth + margin,
              top: "10%",
              transform: "translate(-100%, 0%)",
            }}
          >
            <ScoreBoard
              width={scoreBoardWidth}
              height={scoreBoardHeight}
              clientFlowEngine={clientFlowEngine}
            />
          </div>
        ) : (
          <div />
        )}
        {/* player list */}
        <div
          style={{
            position: "absolute",
            left: (windowWidth - boardSize) / 4,
            bottom: margin,
            transform: "translate(-50%, 0%)",
          }}
        >
          <PlayerListComponent
            width={playerListWidth}
            height={playerListHeight}
            currentUser={
              clientFlowEngine == null ? (null as any) : clientFlowEngine.user
            }
            playerList={playerList}
            isHost={false}
            serverFlowEngine={null as any}
          />
        </div>
        {/* exit button */}
        {isHost ? (
          <button
            className="app-button"
            style={{
              position: "absolute",
              left: margin + playerListWidth + 5,
              bottom: margin,
              transform: "translate(-100%, 0%)",
              width: exitButtonSize,
              height: exitButtonSize,
            }}
            onClick={() => {
              if (serverFlowEngine != null) {
                serverFlowEngine.returnToLobby();
              }
            }}
          >
            <img
              src={exitIcon}
              style={{
                position: "fixed",
                transform: "translate(-50%, -50%)",
                width: exitButtonSize * 0.8,
                height: exitButtonSize * 0.8,
                filter: "contrast(0.5) brightness(3)",
              }}
            />
          </button>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default GamePage;
