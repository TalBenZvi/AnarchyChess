import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";

import { Authentication } from "../database/authentication";
import { LobbyParams, LobbyCreationStatus } from "../database/database_util";

import revealPasswordIcon from "../assets/page_design/reveal_password_icon.png";

interface LobbyCreationFormProps {
  onSuccess: () => void;
}

interface LobbyCreationFormState {
  name: string;
  isWaitingForResponse: boolean;
}

class LobbyCreationForm extends React.Component<
  LobbyCreationFormProps,
  LobbyCreationFormState
> {
  state = {
    name: "",
    isWaitingForResponse: false,
  };

  private setName = (event: any) => {
    this.setState({ name: event.target.value });
  };

  private createLobby = (event: any) => {
    this.setState(() => {
      return { isWaitingForResponse: true };
    });
    Authentication.createLobby(
      { creatorID: Authentication.currentUser.id, name: this.state.name },
      (status: LobbyCreationStatus) => {
        switch (status) {
          case LobbyCreationStatus.success:
            {
              this.props.onSuccess();
            }
            break;
          case LobbyCreationStatus.nameTaken:
            {
              toast("A lobby already exists with this name");
              this.setState(() => {
                return { isWaitingForResponse: false };
              });
            }
            break;
          case LobbyCreationStatus.connectionError:
            {
              toast("There has been a connection error");
              this.setState(() => {
                return { isWaitingForResponse: false };
              });
            }
            break;
        }
      }
    );
    event.preventDefault();
  };

  private textInputField(
    fieldName: string,
    value: string,
    setFunction: (event: any) => void,
    top: number
  ): any {
    return (
      <label>
        {/* text input*/}
        <input
          type="text"
          placeholder={fieldName}
          value={value}
          onChange={setFunction}
          className="clear-text-input"
          style={{
            position: "absolute",
            width: 330,
            top: top,
            fontSize: 18,
            height: 60,
            lineHeight: 20,
          }}
        />
        <hr
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: top + 40,
            width: 440,
          }}
        />
      </label>
    );
  }

  render() {
    let { name, isWaitingForResponse } = this.state;
    return (
      <div
        style={{
          padding: 30,
        }}
      >
        {/* title */}
        <p
          style={{
            fontSize: 40,
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: 10,
            width: 400,
            textAlign: "center",
          }}
        >
          Create New Lobby
        </p>
        <form onSubmit={this.createLobby} spellCheck={false}>
          {/* name */}
          {this.textInputField("Name", name, this.setName, 150)}
          {/* create button */}
          <input
            type="submit"
            value="Create Lobby"
            disabled={isWaitingForResponse}
            className="app-button"
            style={{
              position: "absolute",
              bottom: 25,
              right: 25,
              width: 160,
              height: 40,
              fontSize: 20,
            }}
          />
        </form>
        {/* loading icon */}
        {isWaitingForResponse ? (
          <div
            style={{
              position: "absolute",
              bottom: 25,
              right: 195,
            }}
          >
            <LoadingSpin
              size="25px"
              width="4px"
              primaryColor="#ed1b24"
              secondaryColor="ccc"
            />
          </div>
        ) : (
          <div />
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

export default LobbyCreationForm;
