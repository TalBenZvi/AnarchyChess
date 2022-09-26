import * as React from "react";

import { Lobby } from "../communication/communication_util";

import lockIcon from "../assets/page_design/lock_icon.png";
import teamIcon from "../assets/page_design/team_icon.png";

const PRIVATE_TITLE: string = "Private";
const PREARRANGED_TEAMS_TITLE: string = "Prearranged Teams";

const ATTRIBUTE_ICONS: Map<string, any> = new Map([
  [PRIVATE_TITLE, lockIcon],
  [PREARRANGED_TEAMS_TITLE, teamIcon],
]);

interface LobbyCardProps {
  width: number;
  height: number;
  lobby: Lobby;
  isHost: boolean;
  onClose: () => void;
}

interface LobbyCardState {}

class LobbyCard extends React.Component<LobbyCardProps, LobbyCardState> {
  state = {};

  render() {
    let { width, height, lobby, isHost, onClose } = this.props;
    let titleFontSize: number = width * 0.14;
    let fontSize: number = width * 0.06;
    let iconSize = width * 0.08;
    let lobbyAttributeTitles: string[] = [];
    if (lobby != null) {
      if (lobby.password != null) {
        lobbyAttributeTitles.push(PRIVATE_TITLE);
      }
      if (lobby.areTeamsPrearranged) {
        lobbyAttributeTitles.push(PREARRANGED_TEAMS_TITLE);
      }
    }
    return (
      <div
        className="highlighted-area"
        style={{
          width: width,
          height: height,
        }}
      >
        {/* leave / close lobby button */}
        <button
          className="app-button"
          style={{
            position: "absolute",
            width: width * 0.4,
            height: height * 0.1,
            right: "5%",
            bottom: "4%",
            fontSize: fontSize * 0.85,
          }}
          onClick={onClose}
        >
          {isHost ? "Close Lobby" : "Leave"}
        </button>
        {lobby == null ? (
          <div />
        ) : (
          <div>
            {/* lobby name */}
            <div
              className="centered-title"
              style={{
                position: "absolute",
                fontSize: titleFontSize,
                fontWeight: "bold",
                WebkitTextStroke: "1px",
                WebkitTextStrokeColor: "#000",
              }}
            >
              {lobby.name}
            </div>
            {/* creator name */}
            <div
              className="clear-text"
              style={{
                position: "absolute",
                top: "11%",
                margin: 10,
                fontSize: width * 0.035,
              }}
            >
              {`by ${lobby.creatorName}`}
            </div>
            {/* separator line */}
            <hr
              style={{
                position: "absolute",
                width: width * 0.95,
                height: 0,
                top: "16%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
            {/* attributes */}
            <ul
              className="no-bullets"
              style={{
                position: "absolute",
                top: "22%",
                left: "3%",
              }}
            >
              {lobbyAttributeTitles.map((title: string, _: number) => (
                <li
                  key={Math.random()}
                  className="clear-text"
                  style={{
                    height: height * 0.1,
                    fontSize: fontSize,
                  }}
                >
                  <img
                    src={ATTRIBUTE_ICONS.get(title)}
                    style={{
                      position: "relative",
                      width: iconSize,
                      height: iconSize,
                      top: "35%",
                      transform: "translate(0%, -50%)",
                      marginRight: 10,
                      filter: "contrast(0.5) brightness(3)",
                    }}
                    alt="attribute"
                  />
                  {title}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

export default LobbyCard;
