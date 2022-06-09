import * as React from "react";
import { Component } from "react";

import { Lobby } from "../database/database_util";

interface LobbyCardProps {
  width: number;
  height: number;
  lobby: Lobby;
}

interface LobbyCardState {}

class LobbyCard extends React.Component<LobbyCardProps, LobbyCardState> {
  state = {};

  render() {
    let { width, height, lobby } = this.props;
    let fontSize: number = width * 0.05;
    let titleFontSize: number = width * 0.14;
    //temp
    lobby = {
      id: "0",
      name: "Lorem Ipsum",
      creatorName: "dolor sit amet",
      password: "password",
      areTeamsPrearranged: true,
      memberIDs: [],
    };
    return (
      <div
        className="highlighted-area"
        style={{
          width: width,
          height: height,
        }}
      >
        {lobby == null ? (
          <div />
        ) : (
          <div>
            <div
              className="centered-title"
              style={{
                fontSize: titleFontSize,
                fontWeight: "bold",
                WebkitTextStroke: "1px",
                WebkitTextStrokeColor: "#000",
              }}
            >
              {lobby.name}
            </div>
            <div
              className="clear-text"
              style={{
                position: "absolute",
                top: "12%",
                margin: 10,
                fontSize: fontSize,
              }}
            >
              {`by ${lobby.creatorName}`}
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default LobbyCard;
