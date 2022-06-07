import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";
import { Redirect } from "react-router";

import { Lobby, LobbyJoiningStatus } from "../database/database_util";
import { NUM_OF_PLAYERS } from "../game_flow_util/game_elements";
import { Authentication } from "../database/authentication";

import rightArrow from "../assets/page_design/right_arrow.png";
import refreshIcon from "../assets/page_design/refresh_icon.png";
import lockIcon from "../assets/page_design/lock_icon.png";
import checkmarkIcon from "../assets/page_design/checkmark_icon.png";

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
  selectedLobby: Lobby;
  selectedLobbyForPassword: Lobby;
  targetLobbyID: string;
}

class LobbyList extends React.Component<LobbyListProps, LobbyListState> {
  state = {
    lobbies: [],
    page: 0,
    isWaitingForResponse: true,
    selectedLobby: null as any,
    selectedLobbyForPassword: null as any,
    targetLobbyID: null as any,
  };
  enteredPassword: string = "";

  componentDidMount() {
    this.loadLobbiesFromDatabase();
  }

  private loadLobbiesFromDatabase = () => {
    Authentication.getLobbies((lobbies: Lobby[]) => {
      this.setState({ isWaitingForResponse: false, lobbies: lobbies });
    });
    this.setState({ isWaitingForResponse: true });
  };

  private joinLobby = (lobby: Lobby) => {
    Authentication.joinLobby(lobby, (status: LobbyJoiningStatus) => {
      switch (status) {
        case LobbyJoiningStatus.success:
          {
            this.setState(() => {
              return { targetLobbyID: lobby.id };
            });
          }
          break;
        case LobbyJoiningStatus.failure:
          {
            toast("Error joining lobby");
            this.setState(() => {
              return {
                selectedLobby: null as any,
              };
            });
          }
          break;
        case LobbyJoiningStatus.connectionError:
          {
            toast("There has been a connection error");
            this.setState(() => {
              return {
                selectedLobby: null as any,
              };
            });
          }
          break;
      }
    });
    this.setState({
      selectedLobby: lobby,
      selectedLobbyForPassword: null as any,
    });
  };

  private setEnteredPassword = (event: any) => {
    this.enteredPassword = event.target.value;
  };

  render() {
    let { width, height, onLobbyCreationSelection } = this.props;
    let {
      lobbies,
      page,
      isWaitingForResponse,
      selectedLobby,
      selectedLobbyForPassword,
      targetLobbyID,
    } = this.state;
    if (targetLobbyID != null) {
      return <Redirect push to={`/lobby/${targetLobbyID}`} />;
    }
    let displayedLobbies: Lobby[] = lobbies.slice(
      page * LOBBIES_IN_A_PAGE,
      (page + 1) * LOBBIES_IN_A_PAGE
    );
    let tileWidth: number = width * 0.95;
    let tileHeight: number = (height / LOBBIES_IN_A_PAGE) * 0.75;
    let tileMargin: number = (height / LOBBIES_IN_A_PAGE) * 0.08;
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
            fontWeight: "bold",
          }}
        >
          Lobbies
        </div>
        {/* column titles */}
        {isWaitingForResponse || lobbies.length === 0 ? (
          <div />
        ) : (
          <div>
            <div
              style={{
                position: "fixed",
                left: "10%",
                top: "10%",
                transform: "translate(-50%, 0%)",
                fontSize: fontSize,
                fontWeight: "bold",
              }}
            >
              Name
            </div>
            <div
              style={{
                position: "fixed",
                left: "30%",
                top: "10%",
                transform: "translate(-50%, 0%)",
                fontSize: fontSize,
                fontWeight: "bold",
              }}
            >
              Owner
            </div>
            <div
              style={{
                position: "fixed",
                left: "50%",
                top: "10%",
                transform: "translate(-50%, 0%)",
                fontSize: fontSize,
                fontWeight: "bold",
              }}
            >
              Capacity
            </div>
            <div
              style={{
                position: "fixed",
                left: "70%",
                top: "10%",
                transform: "translate(-50%, 0%)",
                fontSize: fontSize,
                fontWeight: "bold",
              }}
            >
              Prearranged Teams
            </div>
          </div>
        )}
        {/* refresh button */}
        <button
          className="app-button"
          disabled={isWaitingForResponse}
          style={{
            position: "fixed",
            right: "25%",
            top: margin * 0.5,
            width: height * 0.08,
            height: height * 0.08,
            fontSize: fontSize,
            zIndex: 1,
          }}
          onClick={this.loadLobbiesFromDatabase}
        >
          <img
            src={refreshIcon}
            style={{
              position: "fixed",
              transform: "translate(-50%, -50%)",
              width: height * 0.07,
              height: height * 0.07,
              filter: "contrast(0.5) brightness(3)",
            }}
          />
        </button>
        {/* 'create lobby' button */}
        <button
          className="app-button"
          style={{
            position: "fixed",
            right: "2%",
            top: margin * 0.5,
            width: width * 0.2,
            height: height * 0.08,
            fontSize: fontSize,
            zIndex: 1,
          }}
          onClick={onLobbyCreationSelection}
        >
          Create a Lobby
        </button>
        {isWaitingForResponse ? (
          <div>
            {/* searching title */}
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
            {/* searching spinner */}
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
            {/* content indicator */}
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
              {displayedLobbies.map((lobby: Lobby, _: number) => (
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
                      left: "7%",
                      transform: "translate(-50%, 0%)",
                    }}
                  >
                    {lobby.name}
                  </div>
                  {/* lobby owner */}
                  <div
                    style={{
                      position: "fixed",
                      left: "29%",
                      transform: "translate(-50%, 0%)",
                    }}
                  >
                    {lobby.creatorName}
                  </div>
                  {/* lobby capacity */}
                  <div
                    style={{
                      position: "fixed",
                      left: "50%",
                      transform: "translate(-50%, 0%)",
                    }}
                  >{`${
                    lobby.memberIDs.filter((id: string) => id !== "").length
                  } / ${NUM_OF_PLAYERS}`}</div>
                  {/* prearranged teams indicator */}
                  {lobby.areTeamsPrearranged ? (
                    <div
                      style={{
                        position: "fixed",
                        left: "71%",
                        top: "50%",
                        transform: "translate(-50%, 0%)",
                      }}
                    >
                      <img
                          src={checkmarkIcon}
                          style={{
                            position: "absolute",
                            transform: "translate(-50%, -50%)",
                            width: tileHeight * 0.5,
                            height: tileHeight * 0.5,
                            filter: "contrast(0.5) brightness(3)",
                          }}
                        />
                    </div>
                  ) : (
                    <div />
                  )}

                  {/* lock icon */}
                  {lobby.password == null ||
                  selectedLobby == lobby ||
                  selectedLobbyForPassword == lobby ? (
                    <div />
                  ) : (
                    <img
                      src={lockIcon}
                      style={{
                        position: "fixed",
                        left: "85%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        width: tileHeight * 0.5,
                        height: tileHeight * 0.5,
                        filter: "contrast(0.5) brightness(3)",
                      }}
                    />
                  )}
                  {/* join button */}
                  {selectedLobby == lobby ||
                  selectedLobbyForPassword == lobby ? (
                    <div />
                  ) : (
                    <button
                      className="app-button"
                      disabled={
                        selectedLobby != null && selectedLobby !== lobby
                      }
                      style={{
                        position: "relative",
                        float: "right",
                        marginRight: fontPadding,
                        top: "50%",
                        transform: "translate(0%, -50%)",
                        width: width * 0.1,
                        height: buttonHeight,
                        lineHeight: `${buttonHeight * 0.8}px`,
                      }}
                      onClick={() => {
                        if (lobby.password == null) {
                          this.joinLobby(lobby);
                        } else {
                          this.setState({ selectedLobbyForPassword: lobby });
                        }
                      }}
                    >
                      Join
                    </button>
                  )}
                  {/* password input field */}
                  {selectedLobbyForPassword == lobby ? (
                    <div>
                      <input
                        type="password"
                        className="clear-text"
                        placeholder="Password"
                        onChange={this.setEnteredPassword}
                        style={{
                          position: "fixed",
                          left: "88%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          display: "flex",
                          flexWrap: "wrap",
                          height: tileHeight * 0.8,
                          width: width * 0.1,
                          border: "1px solid #ccc",
                          borderRadius: 5,
                          background: "#202020",
                          fontSize: fontSize * 0.9,
                          textAlign: "center",
                        }}
                      />
                      <button
                        className="app-button"
                        style={{
                          position: "fixed",
                          left: "97%",
                          top: "50%",
                          transform: "translate(-50%, -50%)",
                          height: tileHeight * 0.8,
                          width: tileHeight * 0.8,
                        }}
                        onClick={() => {
                          if (this.enteredPassword === lobby.password) {
                            this.joinLobby(lobby);
                          } else {
                            toast("Wrong password");
                          }
                        }}
                      >
                        <img
                          src={checkmarkIcon}
                          style={{
                            position: "fixed",
                            transform: "translate(-50%, -50%)",
                            width: tileHeight * 0.5,
                            height: tileHeight * 0.5,
                            filter: "contrast(0.5) brightness(3)",
                          }}
                        />
                      </button>
                    </div>
                  ) : (
                    <div />
                  )}
                  {/* join lobby loading spinner */}
                  {selectedLobby === lobby ? (
                    <div
                      style={{
                        position: "fixed",
                        left: "93%",
                        top: "50%",
                        transform: "translate(-50%, -50%)",
                        display: "flex",
                        flexWrap: "wrap",
                      }}
                    >
                      <LoadingSpin
                        size={`${tileHeight * 0.5}px`}
                        width="4px"
                        primaryColor="#ed1b24"
                        secondaryColor="ccc"
                      />
                    </div>
                  ) : (
                    <div />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* toaster */}
        <div>
          <Toaster
            toastOptions={{
              className: "",
              style: {
                background: "#000",
                color: "#ccc",
                width: 300,
              },
            }}
            containerStyle={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 300,
            }}
          />
        </div>
      </div>
    );
  }
}

export default LobbyList;
