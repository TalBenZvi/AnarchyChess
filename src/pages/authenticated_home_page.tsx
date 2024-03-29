import * as React from "react";
import NavBar from "../components/navbar";
import LobbyCreationForm from "../components/lobby_creation_form";
import LobbyList from "../components/lobby_list";
import { Redirect } from "react-router";
import { Lobby } from "../communication/communication_util";

interface AuthenticatedHomePageProps {
  windowWidth: number;
  windowHeight: number;
}

interface AuthenticatedHomePageState {
  isLobbyCreationFormOpen: boolean;
  lobbyRedirectionID: string;
}

class AuthenticatedHomePage extends React.Component<
  AuthenticatedHomePageProps,
  AuthenticatedHomePageState
> {
  state = {
    isLobbyCreationFormOpen: false,
    lobbyRedirectionID: null as any,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };

  render() {
    let { isLobbyCreationFormOpen, lobbyRedirectionID } = this.state;
    let { windowHeight, windowWidth } = this.props;
    if (lobbyRedirectionID != null) {
      return <Redirect push to={`/lobby/${lobbyRedirectionID}`} />;
    }
    return (
      <div className="background">
        <NavBar currentRoute="/" />
        {/* lobby creation form */}
        {isLobbyCreationFormOpen ? (
          <div>
            {/* exit dialog detection */}
            <button
              className="dialog"
              onClick={() => this.setState({ isLobbyCreationFormOpen: false })}
            />
            <div
              className="centered"
              style={{
                position: "fixed",
                opacity: 1,
                zIndex: 2,
                color: "#ccc",
              }}
            >
              {/* form area */}
              <div
                className="highlighted-area"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 500,
                  height: 700,
                  zIndex: 2,
                  opacity: 1,
                }}
              >
                {/* form */}
                <LobbyCreationForm
                  onSuccess={(newLobby: Lobby) => {
                    this.setState({ lobbyRedirectionID: newLobby.creatorID });
                  }}
                />
                {/* cancel button */}
                <button
                  className="app-button"
                  style={{
                    position: "absolute",
                    left: 25,
                    bottom: 25,
                    width: 100,
                    height: 40,
                    fontSize: 20,
                    zIndex: 0,
                  }}
                  onClick={() =>
                    this.setState({ isLobbyCreationFormOpen: false })
                  }
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div />
        )}
        {/* lobby list */}
        <div
          className="centered"
          style={{
            position: "absolute",
            top: "15%",
            left: "50%",
            transform: "translate(-50%, 0%)",
          }}
        >
          <LobbyList
            width={windowWidth * 0.7}
            height={windowHeight * 0.8}
            onLobbyCreationSelection={() =>
              this.setState({ isLobbyCreationFormOpen: true })
            }
          />
        </div>
      </div>
    );
  }
}

export default AuthenticatedHomePage;
