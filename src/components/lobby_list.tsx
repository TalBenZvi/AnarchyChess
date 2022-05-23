import * as React from "react";

import { Lobby } from "../database/database_util";

interface LobbyListProps {
  width: number;
  height: number;
  lobbies: Lobby[];
}

interface LobbyListState {}

class LobbyList extends React.Component<LobbyListProps, LobbyListState> {
  state = {};

  render() {
    let { width, height, lobbies } = this.props;
    lobbies = [...Array(10)].map((_, i) => {
      return {
        id: i.toString(),
        name: `lobby ${i}`,
        memberIDs: [...Array(i)].fill("id"),
      };
    });
    let tileWidth: number = width * 0.9;
    let tileHeight: number = height * 0.08;
    let fontSize: number = tileHeight * 0.4;
    return (
      <div
        className="highlighted-area"
        style={{
          zIndex: 0,
          width: width,
          height: height,
        }}
      ></div>
    );
  }
}

export default LobbyList;
