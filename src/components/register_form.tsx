import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";

import validInputIcon from "../assets/page_design/valid_input_icon.png";
import invalidInputIcon from "../assets/page_design/invalid_input_icon.png";
import revealPasswordIcon from "../assets/page_design/reveal_password_icon.png";
import { ClientActionCenter } from "../client_side/client_action_center";
import {
  RegisterParams,
  User,
  WSResponseStatus,
} from "../communication/communication_util";

const USERNAME_REGEX: RegExp = new RegExp("^[a-zA-Z0-9_\\-\\*]{3,20}$", "i");
const EMAIL_REGEX: RegExp = new RegExp(
  "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$",
  "i"
);
const PASSWORD_REGEX: RegExp = new RegExp("^[a-zA-Z0-9_\\-\\*]{8,}$", "i");

interface RegisterFormProps {
  onSuccess: () => void;
}

interface RegisterFormState {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  shownRulesPopup: string;
  shownPassword: string;
  isWaitingForResponse: boolean;
}

class RegisterForm extends React.Component<
  RegisterFormProps,
  RegisterFormState
> {
  clientActionCenter: ClientActionCenter = ClientActionCenter.getInstance();
  state = {
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    shownRulesPopup: null as any,
    shownPassword: null as any,
    isWaitingForResponse: false,
  };

  private setUsername = (event: any) => {
    let username: string = event.target.value;
    if (
      this.state.shownRulesPopup === "Username" &&
      this.checkUsernameValidity(username)
    ) {
      this.setState({
        username: username,
        shownRulesPopup: null as any,
      });
    } else {
      this.setState({ username: username });
    }
  };

  private setEmail = (event: any) => {
    this.setState({ email: event.target.value });
  };

  private setPassword = (event: any) => {
    this.setState({ password: event.target.value });
  };

  private setConfirmPassword = (event: any) => {
    this.setState({ confirmPassword: event.target.value });
  };

  private checkUsernameValidity(username: string): boolean {
    return USERNAME_REGEX.test(username);
  }

  private checkEmailValidity(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }

  private checkPasswordValidity(password: string): boolean {
    return PASSWORD_REGEX.test(password);
  }

  private checkConfirmPasswordValidity(confirmPassword: string): boolean {
    return confirmPassword === this.state.password;
  }

  private submit = (event: any) => {
    this.setState(() => {
      return { isWaitingForResponse: true };
    });
    this.clientActionCenter.register(
      {
        username: this.state.username,
        email: this.state.email,
        password: this.state.password,
      } as RegisterParams,
      (status: WSResponseStatus, user: User) => {
        switch (status) {
          case WSResponseStatus.success:
            this.props.onSuccess();
            break;
          case WSResponseStatus.usernameTaken:
            toast("This username is already taken");
            this.setState(() => {
              return { isWaitingForResponse: false };
            });
            break;
          case WSResponseStatus.emailRegistered:
            toast("A user is already registered with this email address");
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
    isValid: boolean,
    rulesDescription: string
  ): any {
    let isPassword: boolean =
      fieldName === "Password" || fieldName === "Confirm Password";
    return (
      <label>
        {/* text input*/}
        <input
          type={
            isPassword && fieldName !== this.state.shownPassword
              ? "password"
              : "text"
          }
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
        {/* validity icon */}
        {value === "" ? (
          <div />
        ) : (
          <img
            alt="validity icon"
            style={{
              position: "absolute",
              left: "1%",
              top: `${(top + 0.105) * 100}%`,
              transform: "translate(0%, -200%)",
              width: "4.5%",
            }}
            src={isValid ? validInputIcon : invalidInputIcon}
            onMouseOver={() => {
              if (!isValid) {
                this.setState(() => {
                  return { shownRulesPopup: fieldName };
                });
              }
            }}
            onMouseOut={() => {
              if (!isValid) {
                this.setState(() => {
                  return { shownRulesPopup: null as any };
                });
              }
            }}
          />
        )}
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
                return { shownPassword: fieldName };
              });
            }}
            onMouseOut={() => {
              this.setState(() => {
                return { shownPassword: null as any };
              });
            }}
          />
        ) : (
          <div />
        )}
        {/* rules popup */}
        {this.state.shownRulesPopup === fieldName ? (
          <div
            style={{
              position: "absolute",
              left: "-10%",
              top: `${(top - 0.15) * 100}%`,
              width: "35%",
              height: "17%",
              border: "2px solid #888",
              borderRadius: 15,
              background: "#000",
              color: "#ccc",
              padding: "1%",
              fontSize: "0.7vw",
            }}
          >
            {rulesDescription}
          </div>
        ) : (
          <div />
        )}
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
    let {
      username,
      email,
      password,
      confirmPassword,
      shownRulesPopup,
      isWaitingForResponse,
    } = this.state;
    let isUsernameValid = this.checkUsernameValidity(username);
    let isEmailValid = this.checkEmailValidity(email);
    let isPasswordValid = this.checkPasswordValidity(password);
    let isConfirmPasswordValid =
      this.checkConfirmPasswordValidity(confirmPassword);
    // close popup if field becomes valid
    if (
      ((isUsernameValid || username === "") &&
        shownRulesPopup === "Username") ||
      ((isEmailValid || email === "") && shownRulesPopup === "Email") ||
      ((isPasswordValid || password === "") &&
        shownRulesPopup === "Password") ||
      ((isConfirmPasswordValid || confirmPassword === "") &&
        shownRulesPopup === "Confirm Password")
    ) {
      this.setState(() => {
        return { shownRulesPopup: null as any };
      });
    }

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
          Register
        </p>
        <form onSubmit={this.submit} spellCheck={false}>
          {/* username */}
          {this.textInputField(
            "Username",
            username,
            this.setUsername,
            0.28,
            isUsernameValid,
            "Username must be 3-20 characters long and can only contain letters, numbers, '_', '-', and '*'"
          )}
          {/* email */}
          {this.textInputField(
            "Email",
            email,
            this.setEmail,
            0.42,
            isEmailValid,
            "Must be a valid email address"
          )}
          {/* password */}
          {this.textInputField(
            "Password",
            password,
            this.setPassword,
            0.56,
            isPasswordValid,
            "Password must be at least 8 characters long and can only contain letters, numbers, '_', '-', and '*'"
          )}
          {/* confirm password */}
          {this.textInputField(
            "Confirm Password",
            confirmPassword,
            this.setConfirmPassword,
            0.7,
            isConfirmPasswordValid,
            "Must match password"
          )}
          {/* submit button */}
          <input
            type="submit"
            value="Submit"
            disabled={
              isWaitingForResponse ||
              !(
                isUsernameValid &&
                isEmailValid &&
                isPasswordValid &&
                isConfirmPasswordValid
              )
            }
            className="app-button"
            style={{
              position: "absolute",
              bottom: 25,
              right: 25,
              width: 130,
              height: 40,
              fontSize: 20,
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
              },
            }}
            containerStyle={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          />
        </div>
      </div>
    );
  }
}

export default RegisterForm;
