import * as React from "react";

import { User } from "../communication/communication_util";
import { NUM_OF_PLAYERS, PieceColor } from "../game_flow_util/game_elements";
import { PlayerList } from "../game_flow_util/player_list";

import menuIcon from "../assets/page_design/menu_icon.png";
// import { ServerFlowEngine } from "../server_side/server_flow_engine";

const TILE_FONT_COLORS: Map<PieceColor, string> = new Map([
  [null as any, "#ccc"],
  [PieceColor.white, "#bbbbbb"],
  [PieceColor.black, "#050505"],
]);

const KICK_MENU_TITLE: string = "Kick";
const CHANGE_TEAM_MENU_TITLE: string = "Change Team";

interface PlayerListProps {
  width: number;
  height: number;
  currentUser: User;
  isHost: boolean;
  playerList: PlayerList;
  // serverFlowEngine: ServerFlowEngine;
}

interface PlayerListState {
  openMenuIndex: number;
}

class PlayerListComponent extends React.Component<
  PlayerListProps,
  PlayerListState
> {
  state = {
    openMenuIndex: null as any,
  };

  private tileList(
    isLeftColumn: boolean,
    players: User[],
    tileWidth: number,
    tileHeight: number,
    tileMargin: number,
    fontSize: number,
    color: PieceColor
  ) {
    let { openMenuIndex } = this.state;
    let { isHost, currentUser } = this.props;
    let openMenuButtonSize = tileHeight * 0.6;
    return (
      <ul
        className="no-bullets"
        style={{
          position: "absolute",
          zIndex: 1,
        }}
      >
        {players.slice(0, NUM_OF_PLAYERS / 2).map((player: User, i: number) => (
          <li key={Math.random()}>
            {/* tile */}
            <div
              style={{
                position: "relative",
                height: tileHeight,
                width: tileWidth,
                marginTop: tileMargin,
                marginBottom: tileMargin,
                marginLeft: tileMargin,
                paddingLeft: tileMargin * 2,
                boxSizing: "border-box",
                zIndex: 1,
                background: "#272727",
                border: "3px solid #252525",
                borderRadius: "5px",
                color: TILE_FONT_COLORS.get(color),
                lineHeight: `${tileHeight * 0.8}px`,
                fontSize: fontSize,
                fontWeight:
                  player != null && player.username === currentUser.username
                    ? "bold"
                    : "normal",
              }}
            >
              {player == null ? "" : player.username}
              {/* open menu button */}
              {isHost && player != null ? (
                <div>
                  <button
                    className="small-button"
                    style={{
                      position: "absolute",
                      right: "5%",
                      top: "50%",
                      transform: "translate(50%,-50%)",
                      zIndex: 2,
                      width: openMenuButtonSize,
                      height: openMenuButtonSize,
                    }}
                    onClick={() => {
                      if (
                        (isLeftColumn && openMenuIndex === i) ||
                        (!isLeftColumn &&
                          openMenuIndex === i + NUM_OF_PLAYERS / 2)
                      ) {
                        this.setState({ openMenuIndex: null as any });
                      } else {
                        this.setState({
                          openMenuIndex: isLeftColumn
                            ? i
                            : i + NUM_OF_PLAYERS / 2,
                        });
                      }
                    }}
                  >
                    <img
                      alt="options"
                      src={menuIcon}
                      style={{
                        position: "fixed",
                        transform: "translate(-50%, -50%)",
                        width: openMenuButtonSize * 0.7,
                        height: openMenuButtonSize * 0.7,
                        filter: "contrast(0.5) brightness(3)",
                      }}
                    />
                  </button>
                </div>
              ) : (
                <div />
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    let { width, height, currentUser, playerList } =
      this.props;
    let { openMenuIndex } = this.state;

    let tileAreaHeight: number = height / (NUM_OF_PLAYERS / 2);
    let tileAreaWidth: number = width / 2;
    let tileHeight: number = tileAreaHeight * 0.9;
    let tileMargin = tileHeight * 0.1;
    let tileWidth: number = tileAreaWidth - tileMargin * 2;

    let fontSize: number = tileHeight * 0.5;

    let areTeamsPrearranged: boolean =
      playerList != null && playerList.areTeamsPrearranged;

    let leftColumnPlayers: User[];
    let rightColumnPlayers: User[];
    if (playerList == null) {
      leftColumnPlayers = [...Array(NUM_OF_PLAYERS / 2)].fill(null);
      rightColumnPlayers = [...Array(NUM_OF_PLAYERS / 2)].fill(null);
    } else if (areTeamsPrearranged) {
      let whiteTeamPlayers: User[] = playerList.getUsersByAssignedColor(
        PieceColor.white
      );
      let blackTeamPlayers: User[] = playerList.getUsersByAssignedColor(
        PieceColor.black
      );
      leftColumnPlayers = [
        ...whiteTeamPlayers,
        ...Array(NUM_OF_PLAYERS / 2 - whiteTeamPlayers.length).fill(null),
      ];
      rightColumnPlayers = [
        ...blackTeamPlayers,
        ...Array(NUM_OF_PLAYERS / 2 - blackTeamPlayers.length).fill(null),
      ];
    } else {
      let connectedPlayers: User[] = playerList.getConnectedUsers();
      let players = [
        ...connectedPlayers,
        ...Array(NUM_OF_PLAYERS - connectedPlayers.length).fill(null),
      ];
      leftColumnPlayers = players.slice(0, NUM_OF_PLAYERS / 2);
      rightColumnPlayers = players.slice(NUM_OF_PLAYERS / 2);
    }

    let menuButtonWidth: number = tileWidth * 0.4;
    let menuButtonHeight: number = tileHeight * 0.7;
    let openMenuPlayer: User = null as any;
    let menuOptions: string[] = [];
    if (openMenuIndex != null) {
      if (openMenuIndex < NUM_OF_PLAYERS / 2) {
        openMenuPlayer = leftColumnPlayers[openMenuIndex];
      } else {
        openMenuPlayer = rightColumnPlayers[openMenuIndex - NUM_OF_PLAYERS / 2];
      }
      if (openMenuPlayer != null) {
        if (openMenuPlayer.id !== currentUser.id) {
          menuOptions.push(KICK_MENU_TITLE);
        }
        if (areTeamsPrearranged) {
          menuOptions.push(CHANGE_TEAM_MENU_TITLE);
        }
      }
    }

    return (
      <div
        className="highlighted-area"
        style={{
          zIndex: 2,
          width: width,
          height: height,
        }}
      >
        {/* left row */}
        {this.tileList(
          true,
          leftColumnPlayers,
          tileWidth,
          tileHeight,
          tileMargin,
          fontSize,
          areTeamsPrearranged ? PieceColor.white : (null as any)
        )}
        {/* right row */}
        <div
          style={{
            position: "absolute",
            left: width / 2,
          }}
        >
          {this.tileList(
            false,
            rightColumnPlayers,
            tileWidth,
            tileHeight,
            tileMargin,
            fontSize,
            areTeamsPrearranged ? PieceColor.black : (null as any)
          )}
        </div>
        {/* menu */}
        {openMenuPlayer != null && menuOptions.length !== 0 ? (
          <div
            style={{
              position: "absolute",
              left:
                (Math.floor(openMenuIndex / (NUM_OF_PLAYERS / 2)) + 0.48) *
                tileAreaWidth,
              top:
                ((openMenuIndex % (NUM_OF_PLAYERS / 2)) + 0.3) * tileAreaHeight,
              width: menuButtonWidth,
              height: menuButtonHeight * menuOptions.length,
              zIndex: 2,
              background: "#222222",
              border: "1px solid #aaa",
              borderRadius: 5,
            }}
          >
            <ul className="no-bullets">
              {menuOptions.map((option: string, i: number) => (
                <li key={Math.random()}>
                  <button
                    className="clear-button"
                    style={{
                      width: menuButtonWidth,
                      height: menuButtonHeight,
                      textAlign: "center",
                    }}
                    onClick={() => {
                      // switch (option) {
                      //   case KICK_MENU_TITLE: {
                      //     if (serverFlowEngine != null) {
                      //       serverFlowEngine.kickPlayer(openMenuPlayer);
                      //     }
                      //     break;
                      //   }
                      //   case CHANGE_TEAM_MENU_TITLE: {
                      //     if (serverFlowEngine != null) {
                      //       serverFlowEngine.changePlayerTeam(openMenuPlayer);
                      //     }
                      //     break;
                      //   }
                      // }
                      // this.setState({ openMenuIndex: null as any });
                    }}
                  >
                    <div className="menu-option">{option}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div />
        )}
      </div>
    );
  }
}

export default PlayerListComponent;
