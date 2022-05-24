import * as React from "react";
import LoadingSpin from "react-loading-spin";

import { Lobby } from "../database/database_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import rightArrow from "../assets/page_design/right_arrow.png";
import { Authentication } from "../database/authentication";
import LobbyCreationForm from "./lobby_creation_form";

const LOBBIES_IN_A_PAGE: number = 10;

interface LobbyListProps {
  width: number;
  height: number;
  onLobbyCreationSelection: () => void;
}

interface LobbyListState {
  lobbies: Lobby[];
  page: number;
  isWaitingForResponse: boolean;
}

class LobbyList extends React.Component<LobbyListProps, LobbyListState> {
  state = {
    lobbies: [],
    /*
    lobbies: [...Array(25)].map((_, i) => {
      return {
        id: (i + 1).toString(),
        name: `lobby ${i + 1}`,
        memberIDs: [...Array(i)].fill("id"),
      };
    }),
    */
    page: 0,
    isWaitingForResponse: true,
  };

  componentDidMount() {
    Authentication.getLobbies((lobbies: Lobby[]) => {
      this.setState({isWaitingForResponse: false, lobbies: lobbies});
    });
  }

  render() {
    let { width, height, onLobbyCreationSelection } = this.props;
    let { lobbies, page, isWaitingForResponse } = this.state;
    let displayedLobbies: Lobby[] = lobbies.slice(
      page * LOBBIES_IN_A_PAGE,
      (page + 1) * LOBBIES_IN_A_PAGE
    );
    let tileWidth: number = width * 0.95;
    let tileHeight: number = (height / LOBBIES_IN_A_PAGE) * 0.75;
    let tileMargin: number = (height / LOBBIES_IN_A_PAGE) * 0.1;
    let titleFontSize: number = tileHeight;
    let fontSize: number = tileHeight * 0.45;
    let fontPadding: number = tileHeight * 0.4;
    let buttonHeight: number = tileHeight * 0.7;
    let margin: number = (width - tileWidth) / 2;
    let pageIndicatorTopMargin: number = margin * 0.9;
    let loadingSpinnerSize: number = height * 0.3;
    return (
      <div
        className="highlighted-area"
        style={{
          width: width,
          height: height,
        }}
      >
        {/* title */}
        <div
          style={{
            position: "relative",
            left: "50%",
            transform: "translate(-50%, 0%)",
            fontSize: titleFontSize,
            display: "inline-block",
          }}
        >
          Lobbies
        </div>
        {/* 'create lobby' button */}
        <button
          className="app-button"
          style={{
            position: "fixed",
            right: margin,
            top: margin * 0.5,
            width: 200,
            height: 50,
            fontSize: fontSize,
            zIndex: 1,
          }}
          onClick={onLobbyCreationSelection}
        >
          Create a Lobby
        </button>

        {isWaitingForResponse ? (
          <div>
            {/* loading title */}
            <div
              className="centered-title"
              style={{
                position: "fixed",
                top: "32%",
                left: "50%",
                transform: "translate(-50%, 0%)",
                fontSize: fontSize * 1.4,
                display: "inline-block",
              }}
            >
              Searching for lobbies...
            </div>
            {/* loading spinner */}
            <div
              style={{
                position: "fixed",
                top: "60%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              <LoadingSpin
                size={`${loadingSpinnerSize}px`}
                width="8px"
                primaryColor="#ed1b24"
                secondaryColor="ccc"
              />
            </div>
          </div>
        ) : (
          <div>
            {/* 'no lobbies' text */}
            {lobbies.length === 0 ? (
              <div
                className="centered-title"
                style={{
                  position: "fixed",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: fontSize * 1.4,
                  display: "inline-block",
                }}
              >
                There are no lobbies currently available
              </div>
            ) : (
              <div />
            )}
            {/* left arrow */}
            <button
              className="clear-button"
              disabled={page == 0}
              onClick={() => {
                this.setState({ page: page - 1 });
              }}
            >
              <img
                className="image-button"
                src={rightArrow}
                style={{
                  position: "fixed",
                  top: pageIndicatorTopMargin,
                  left: margin,
                  width: tileHeight * 0.4,
                  height: tileHeight * 0.8,
                  transform: "scaleX(-1)",
                }}
              ></img>
            </button>
            {/* content text */}
            <div
              style={{
                position: "fixed",
                top: pageIndicatorTopMargin,
                left: margin * 2,
                height: tileHeight * 0.8,
                width: margin * 5,
                fontSize: fontSize * 1.1,
                display: "inline-block",
                textAlign: "center",
                lineHeight: `${tileHeight * 0.8}px`,
              }}
            >
              {`${
                lobbies.length == 0 ? 0 : page * LOBBIES_IN_A_PAGE + 1
              } - ${Math.min(
                (page + 1) * LOBBIES_IN_A_PAGE,
                lobbies.length
              )} / ${lobbies.length}`}
            </div>
            {/* right arrow */}
            <button
              className="clear-button"
              disabled={lobbies.length <= (page + 1) * LOBBIES_IN_A_PAGE}
              onClick={() => {
                this.setState({ page: page + 1 });
              }}
            >
              <img
                className="image-button"
                src={rightArrow}
                style={{
                  position: "fixed",
                  top: pageIndicatorTopMargin,
                  left: margin * 7.3,
                  width: tileHeight * 0.4,
                  height: tileHeight * 0.8,
                }}
              ></img>
            </button>
            {/* lobbies */}
            <ul className="no-bullets">
              {displayedLobbies.map((lobby: Lobby, _) => (
                <li
                  key={Math.random()}
                  style={{
                    position: "relative",
                    left: "50%",
                    transform: "translate(-50%, 0%)",
                    width: tileWidth,
                    height: tileHeight,
                    borderRadius: "5px",
                    background: "#2d2d2d",
                    marginTop: tileMargin,
                    fontSize: fontSize,
                    lineHeight: `${tileHeight}px`,
                  }}
                >
                  {/* lobby name */}
                  <div
                    style={{
                      position: "fixed",
                      paddingLeft: fontPadding,
                    }}
                  >
                    {lobby.name}
                  </div>
                  {/* lobby capacity */}
                  <div
                    style={{
                      position: "fixed",
                      left: "50%",
                      transform: "translate(-50%, 0%)",
                    }}
                  >{`${lobby.memberIDs.length} / ${NUM_OF_PLAYERS}`}</div>
                  {/* join button */}
                  <button
                    className="app-button"
                    style={{
                      position: "relative",
                      float: "right",
                      marginRight: fontPadding,
                      top: "50%",
                      transform: "translate(0%, -50%)",
                      width: 100,
                      height: buttonHeight,
                      lineHeight: `${buttonHeight * 0.8}px`,
                    }}
                  >
                    Join
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }
}

export default LobbyList;
