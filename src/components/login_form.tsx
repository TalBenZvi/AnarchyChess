import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";

import revealPasswordIcon from "../assets/page_design/reveal_password_icon.png";
import { ClientActionCenter } from "../client_side/client_action_center";
import {
  User,
  LoginParams,
  WSResponseStatus,
} from "../communication/communication_util";

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
    ClientActionCenter.getInstance().login(
      {
        usernameOrEmail: this.state.usernameOrEmail,
        password: this.state.password,
      } as LoginParams,
      (status: WSResponseStatus, user: User) => {
        switch (status) {
          case WSResponseStatus.success:
            this.props.onSuccess();
            break;
          case WSResponseStatus.failure:
            toast("Username or password is incorrect");
            this.setState(() => {
              return { isWaitingForResponse: false };
            });
            break;
          case WSResponseStatus.connectionError:
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
    top: number,
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
            width: "87%",
            left: "7%",
            top: `${top * 100}%`,
            fontSize: "1vw",
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
              left: "87%",
              top: `${(top + 0.025) * 100}%`,
              width: "7.5%",
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
        {/* line */}
        <hr
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: `${(top + 0.07) * 100}%`,
            width: "87%",
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
        {/* title */}
        <p
          style={{
            fontSize: "2.2vw",
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: "5%",
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
            0.28,

          )}
          {/* password */}
          {this.textInputField("Password", password, this.setPassword, 0.42)}
          {/* submit button */}
          <input
            type="submit"
            value="Submit"
            disabled={isWaitingForResponse}
            className="app-button"
            style={{
              position: "absolute",
              bottom: "4%",
              right: "5%",
              width: "30%",
              height: "7%",
              fontSize: "1vw",
              fontWeight: "bold",
            }}
          />
        </form>
        {/* loading icon */}
        {isWaitingForResponse ? (
          <div
            style={{
              position: "absolute",
              bottom: "4%",
              right: "40%",
            }}
          >
            <LoadingSpin
              size="1.2vw"
              width="0.3vw"
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
