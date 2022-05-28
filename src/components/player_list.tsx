import * as React from "react";

import { ClientFlowEngine } from "../client_side/client_flow_engine";
import { Authentication } from "../database/authentication";
import { User } from "../database/database_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { PlayerListComponent } from "./game_component_interfaces";

interface PlayerListProps {
  width: number;
  height: number;
  clientFlowEngine: ClientFlowEngine;
}

interface PlayerListState {
  connectedPlayers: User[];
}

class PlayerList
  extends React.Component<PlayerListProps, PlayerListState>
  implements PlayerListComponent
{
  state = {
    //connectedPlayers: [],

    connectedPlayers: [
      {
        id: "testID",
        username: "admin",
      },
      ...[...Array(20)].map((_, i) => ({
        id: i.toString(),
        username: `player ${i}`,
      })),
    ],
  };

  constructor(props: PlayerListProps) {
    super(props);
    if (props.clientFlowEngine != null) {
      props.clientFlowEngine.playerList = this;
    }
  }

  setPlayers(players: User[]): void {
    this.setState({ connectedPlayers: players });
  }

  private tileList(
    playerList: User[],
    tileWidth: number,
    tileHeight: number,
    fontSize: number
  ) {
    return (
      <ul
        className="no-bullets"
        style={{
          position: "absolute",
          zIndex: 1,
        }}
      >
        {playerList
          .slice(0, NUM_OF_PLAYERS / 2)
          .map((player: User, i: number) => (
            <li key={Math.random()}>
              <div
                style={{
                  boxSizing: "border-box",
                  height: tileHeight,
                  width: tileWidth,
                  lineHeight: `${tileHeight}px`,
                  paddingLeft: tileWidth * 0.05,
                  color: "#ccc",
                  borderBottom:
                    i === NUM_OF_PLAYERS / 2 - 1 ? "" : "2px solid #555",
                  fontSize: fontSize,
                  fontWeight:
                    player != null &&
                    player.username === Authentication.currentUser.username
                      ? "bold"
                      : "normal",
                }}
              >
                {player == null ? "" : player.username}
              </div>
            </li>
          ))}
      </ul>
    );
  }

  render() {
    let { width, height } = this.props;
    let { connectedPlayers } = this.state;
    let tileWidth: number = width / 2;
    let tileHeight: number = (height / NUM_OF_PLAYERS) * 2;
    let verticalLineHeight: number = height;
    let verticalLineMargin: number = 0;
    let fontSize: number = tileHeight * 0.4;
    let playerList: User[] = [
      ...connectedPlayers,
      ...Array(NUM_OF_PLAYERS - connectedPlayers.length).fill(null),
    ];
    return (
      <div
        className="highlighted-area"
        style={{
          position: "fixed",
          zIndex: 0,
          width: width,
          height: height,
          border: "3px solid #555",
        }}
      >
        {/* left row */}
        {this.tileList(
          playerList.slice(0, NUM_OF_PLAYERS / 2),
          tileWidth,
          tileHeight,
          fontSize
        )}
        {/* right row */}
        <div
          style={{
            position: "absolute",
            left: tileWidth,
          }}
        >
          {this.tileList(
            playerList.slice(NUM_OF_PLAYERS / 2),
            tileWidth,
            tileHeight,
            fontSize
          )}
        </div>
        {/* horizontal line */}
        <div
          style={{
            position: "relative",
            left: tileWidth,
            top: verticalLineMargin,
            height: verticalLineHeight,
            borderLeft: "2px solid #555",
            zIndex: 2,
          }}
        />
      </div>
    );
  }
}

export default PlayerList;
