import * as React from "react";
import NavBar from "../components/navbar";
import LobbyCreationForm from "../components/lobby_creation_form";

interface AuthenticatedHomePageProps {}

interface AuthenticatedHomePageState {
  isLobbyCreationFormOpen: boolean;
}

class AuthenticatedHomePage extends React.Component<
  AuthenticatedHomePageProps,
  AuthenticatedHomePageState
> {
  state = {
    isLobbyCreationFormOpen: true,
  };

  createALobby = () => {};

  render() {
    let { isLobbyCreationFormOpen } = this.state;
    return (
      <div className="background">
        <NavBar />
        {/* 'create lobby' button */}
        <button
          className="app-button"
          disabled={isLobbyCreationFormOpen}
          style={{
            position: "absolute",
            left: 1200,
            top: 200,
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
                <LobbyCreationForm onSuccess={() => {
                  alert("lobby created");
                }} />
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
      </div>
    );
  }
}

export default AuthenticatedHomePage;
