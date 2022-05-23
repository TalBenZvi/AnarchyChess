import * as React from "react";
import NavBar from "../components/navbar";
import LobbyCreationForm from "../components/lobby_creation_form";
import LobbyList from "../components/lobby_list";
import { Redirect } from "react-router";
import { Authentication } from "../database/authentication";

interface AuthenticatedHomePageProps {}

interface AuthenticatedHomePageState {
  isLobbyCreationFormOpen: boolean;
  shouldRedirectToGame: boolean;
}

class AuthenticatedHomePage extends React.Component<
  AuthenticatedHomePageProps,
  AuthenticatedHomePageState
> {
  state = {
    isLobbyCreationFormOpen: false,
    shouldRedirectToGame: false,
  };

  createALobby = () => {};

  render() {
    let { isLobbyCreationFormOpen, shouldRedirectToGame } = this.state;
    if (shouldRedirectToGame) {
      return (
        <Redirect
          push
          to={`/lobby/${Authentication.serverFlowEngine.gameID}`}
        />
      );
    }
    return (
      <div className="background">
        <NavBar currentRoute="/" />
        {/* 'create lobby' button */}
        <button
          className="app-button"
          disabled={isLobbyCreationFormOpen}
          style={{
            position: "absolute",
            left: 1200,
            top: 180,
            width: 200,
            height: 50,
            fontSize: 20,
            zIndex: 0,
          }}
          onClick={() => this.setState({ isLobbyCreationFormOpen: true })}
        >
          Create a Lobby
        </button>
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
                  onSuccess={() => {
                    this.setState({ shouldRedirectToGame: true });
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
          style={{
            position: "fixed",
            top: 250,
            left: "50%",
            transform: "translate(-50%, 0%)",
          }}
        >
          <LobbyList width={900} height={600} lobbies={[]} />
        </div>
        
      </div>
    );
  }
}

export default AuthenticatedHomePage;
