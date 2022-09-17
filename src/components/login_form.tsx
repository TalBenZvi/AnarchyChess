import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";
import { Redirect } from "react-router";

import { Authentication } from "../database/authentication";
import { LoginParams, LoginStatus } from "../database/database_util";

import revealPasswordIcon from "../assets/page_design/reveal_password_icon.png";
import { ClientActionCenter } from "../client_side/client_action_center";
import { User } from "../communication/communication_util";

interface LoginFormProps {
  onSuccess: () => void;
}

interface LoginFormState {
  usernameOrEmail: string;
  password: string;
  isPasswordShown: boolean;
  isWaitingForResponse: boolean;
}

class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  private clientActionCenter = ClientActionCenter.getInstance();
  state = {
    usernameOrEmail: "",
    password: "",
    isPasswordShown: false,
    isWaitingForResponse: false,
  };

  private setUsernameOrEmail = (event: any) => {
    this.setState({ usernameOrEmail: event.target.value });
  };

  private setPassword = (event: any) => {
    this.setState({ password: event.target.value });
  };

  private submit = (event: any) => {
    this.setState(() => {
      return { isWaitingForResponse: true };
    });
    this.clientActionCenter.login(
      {
        usernameOrEmail: this.state.usernameOrEmail,
        password: this.state.password,
      } as LoginParams,
      (status: LoginStatus, user: User) => {
        switch (status) {
          case LoginStatus.success:
            this.props.onSuccess();
            break;
          case LoginStatus.failure:
            toast("Username or password is incorrect");
            this.setState(() => {
              return { isWaitingForResponse: false };
            });
            break;
          case LoginStatus.connectionError:
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
    let isPassword: boolean = fieldName === "Password";
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
        {/* reveal password icon */}
        {isPassword ? (
          <img
            alt="reveal password"
            style={{
              position: "absolute",
              left: 390,
              top: top + 15,
              width: 30,
              filter: "contrast(70%)",
            }}
            src={revealPasswordIcon}
            onMouseOver={() => {
              this.setState(() => {
                return { isPasswordShown: true };
              });
            }}
            onMouseOut={() => {
              this.setState(() => {
                return { isPasswordShown: false };
              });
            }}
          />
        ) : (
          <div />
        )}
        <hr
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: top + 40,
            width: 385,
          }}
        />
      </label>
    );
  }

  render() {
    let { usernameOrEmail, password, isWaitingForResponse } = this.state;
    return (
      <div
        style={{
          padding: 30,
        }}
      >
        {Authentication.currentUser == null ? (
          <div />
        ) : (
          <Redirect push to="/game" />
        )}
        {/* title */}
        <p
          style={{
            fontSize: 40,
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: 40,
          }}
        >
          Login
        </p>
        <form onSubmit={this.submit} spellCheck={false}>
          {/* username or email */}
          {this.textInputField(
            "Username or Email",
            usernameOrEmail,
            this.setUsernameOrEmail,
            170
          )}
          {/* password */}
          {this.textInputField("Password", password, this.setPassword, 250)}
          {/* submit button */}
          <input
            type="submit"
            value="Submit"
            disabled={isWaitingForResponse}
            className="app-button"
            style={{
              position: "absolute",
              bottom: 25,
              right: 25,
              width: 130,
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
              right: 165,
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

export default LoginForm;
