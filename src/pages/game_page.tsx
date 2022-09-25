import React from "react";

import NavBar from "../components/navbar";
import GraveYard from "../components/graveyard";
import DeathScreen from "../components/death_screen";
import PromotionScreen from "../components/promotion_screen";
import GameStartScreen from "../components/game_start_screen";
import { PieceColor } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";
import ChessBoard from "../components/chess_board";
import GameEndScreen from "../components/game_end_screen";
import ScoreBoard from "../components/scoreboard";
import PlayerListComponent from "../components/player_list_component";
import { PlayerList } from "../game_flow_util/player_list";
import { Lobby } from "../communication/communication_util";
import { SoundEffectsPlayer } from "../components/sound_effects_player";

import exitIcon from "../assets/page_design/exit_icon.png";
import mutedIcon from "../assets/page_design/muted_icon.png";
import unmutedIcon from "../assets/page_design/unmuted_icon.png";
import { ClientActionCenter } from "../client_side/client_action_center";

interface GamePageProps {
  lobby: Lobby;
  isHost: boolean;
  playerList: PlayerList;
  clientFlowEngine: ClientFlowEngine;
}

interface GamePageState {
  windowWidth: number;
  windowHeight: number;
}

class GamePage extends React.Component<GamePageProps, GamePageState> {
  clientActionCenter: ClientActionCenter = ClientActionCenter.getInstance();
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
    let { lobby, playerList, isHost, clientFlowEngine } = this.props;
    let { windowWidth, windowHeight } = this.state;

    let margin = 50;

    let boardSize: number = windowHeight * 0.85;

    let graveyardWidth: number = (windowWidth - boardSize) / 2 - 2 * margin;
    let graveyardHeight = boardSize * 0.985;

    let scoreBoardWidth: number = graveyardWidth;
    let scoreBoardHeight: number = 220;

    let playerListWidth: number = graveyardWidth;
    let playerListHeight: number = boardSize - scoreBoardHeight - margin;

    let buttonSize: number = 50;

    return (
      // background
      <div className="background">
        <NavBar
          currentRoute={`/lobby/${this.clientActionCenter.currentLobby.creatorID}`}
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
        {/* mute button */}
        <button
          className="app-button"
          style={{
            position: "absolute",
            left: margin - 5,
            bottom: playerListHeight + scoreBoardHeight + 2 * margin - 5,
            transform: "translate(0%, 100%)",
            width: buttonSize,
            height: buttonSize,
            zIndex: 2,
          }}
          onClick={() => {
            if (this.soundEffectsPlayer.isMuted) {
              this.soundEffectsPlayer.unmute();
              this.setState({});
            } else {
              this.soundEffectsPlayer.mute();
              this.setState({});
            }
          }}
        >
          <img
            src={
              this.soundEffectsPlayer != null && this.soundEffectsPlayer.isMuted
                ? mutedIcon
                : unmutedIcon
            }
            style={{
              position: "fixed",
              transform: "translate(-50%, -50%)",
              width: buttonSize * 0.6,
              height: buttonSize * 0.6,
              filter: "contrast(0.5) brightness(3)",
            }}
            alt="mute / unmute"
          />
        </button>
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
            currentUser={this.clientActionCenter.currentUser}
            playerList={playerList}
            isHost={false}
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
              width: buttonSize,
              height: buttonSize,
            }}
            onClick={() => {
              this.clientActionCenter.returnToLobby();
            }}
          >
            <img
              src={exitIcon}
              style={{
                position: "fixed",
                transform: "translate(-50%, -50%)",
                width: buttonSize * 0.8,
                height: buttonSize * 0.8,
                filter: "contrast(0.5) brightness(3)",
              }}
              alt="exit to lobby"
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
