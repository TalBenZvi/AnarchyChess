import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";

import { LobbyCreationStatus } from "../communication/communication_util";

import revealPasswordIcon from "../assets/page_design/reveal_password_icon.png";
import { ClientActionCenter } from "../client_side/client_action_center";
import {
  Lobby,
  LobbyCreationParams,
} from "../communication/communication_util";

interface LobbyCreationFormProps {
  onSuccess: (newLobby: Lobby) => void;
}

interface LobbyCreationFormState {
  name: string;
  isPrivate: boolean;
  password: string;
  isPasswordShown: boolean;
  areTeamsPrearranged: boolean;
  isWaitingForResponse: boolean;
}

class LobbyCreationForm extends React.Component<
  LobbyCreationFormProps,
  LobbyCreationFormState
> {
  clientActionCenter: ClientActionCenter = ClientActionCenter.getInstance();
  state = {
    name: "",
    isPrivate: false,
    password: "",
    isPasswordShown: false,
    areTeamsPrearranged: false,
    isWaitingForResponse: false,
  };

  private setName = (event: any) => {
    this.setState({ name: event.target.value });
  };

  private setIsPrivate = () => {
    this.setState({ isPrivate: !this.state.isPrivate });
  };

  private setPassword = (event: any) => {
    this.setState({ password: event.target.value });
  };

  private setAreTeamsPrearranged = () => {
    this.setState({ areTeamsPrearranged: !this.state.areTeamsPrearranged });
  };

  private createLobby = (event: any) => {
    let { name, isPrivate, password, areTeamsPrearranged } = this.state;
    this.setState(() => {
      return { isWaitingForResponse: true };
    });
    this.clientActionCenter.createLobby(
      {
        name: name,
        password: isPrivate ? password : (null as any),
        areTeamsPrearranged: areTeamsPrearranged,
      } as LobbyCreationParams,
      (status: LobbyCreationStatus, newLobby: Lobby) => {
        switch (status) {
          case LobbyCreationStatus.success:
            this.props.onSuccess(newLobby);
            break;
          case LobbyCreationStatus.nameTaken:
            toast("A lobby already exists with this name");
            this.setState(() => {
              return { isWaitingForResponse: false };
            });
            break;
          case LobbyCreationStatus.connectionError:
            toast("There has been a connection error");
            this.setState(() => {
              return { isWaitingForResponse: false };
            });
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
    let isPassword = fieldName === "Password";
    return (
      <label>
        {/* text input*/}
        <input
          type={isPassword && !this.state.isPasswordShown ? "password" : "text"}
          placeholder={fieldName}
          value={value}
          onChange={setFunction}
          className="clear-text"
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
        {/* requirement */}
        {value.length < 1 || value.length > 15 ? (
          <div
            style={{
              position: "absolute",
              top: top + 50,
              fontSize: 13,
            }}
          >
            * Must be 1-15 characters long
          </div>
        ) : (
          <div />
        )}
        {/* reveal password icon */}
        {isPassword ? (
          <img
            alt="reveal password"
            style={{
              position: "absolute",
              left: 440,
              top: top + 15,
              width: 30,
              filter: "contrast(70%)",
            }}
            src={revealPasswordIcon}
            onMouseOver={() => {
              this.setState({ isPasswordShown: true });
            }}
            onMouseOut={() => {
              this.setState({ isPasswordShown: false });
            }}
          />
        ) : (
          <div />
        )}
      </label>
    );
  }

  private checkboxInputField(
    name: string,
    isChecked: boolean,
    setFunction: () => void,
    top: number
  ): any {
    return (
      <div>
        {/* checkbox input */}
        <button
          className={isChecked ? "checked-checkbox" : "checkbox"}
          style={{
            position: "absolute",
            top: top,
            height: 20,
            width: 20,
          }}
          onClick={setFunction}
        />
        {/* title */}
        <div
          className="clear-text"
          style={{
            position: "absolute",
            top: top - 10,
            left: 60,
            height: 60,
            fontSize: 25,
            fontWeight: "bold",
          }}
        >
          {name}
        </div>
      </div>
    );
  }

  render() {
    let {
      name,
      isPrivate,
      password,
      areTeamsPrearranged,
      isWaitingForResponse,
    } = this.state;
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
            fontWeight: "bold",
          }}
        >
          Create New Lobby
        </p>
        <form onSubmit={this.createLobby} spellCheck={false}>
          {/* name */}
          {this.textInputField("Name", name, this.setName, 150)}
          {/* password */}
          {isPrivate ? (
            this.textInputField("Password", password, this.setPassword, 270)
          ) : (
            <div />
          )}
          {/* create button */}
          <input
            type="submit"
            value="Create Lobby"
            disabled={
              isWaitingForResponse ||
              name === "" ||
              (isPrivate && password === "")
            }
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
        {/* private checkbox */}
        {this.checkboxInputField("Private", isPrivate, this.setIsPrivate, 255)}
        {/* prearranged teams checkbox */}
        {this.checkboxInputField(
          "Prearranged Teams",
          areTeamsPrearranged,
          this.setAreTeamsPrearranged,
          520
        )}
        <div
          className="clear-text"
          style={{
            position: "absolute",
            top: 550,
          }}
        >
          * Teams will be decided before the game starts and won't change
          between rounds
        </div>
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
