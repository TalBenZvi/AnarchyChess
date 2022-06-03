import * as React from "react";
import LoadingSpin from "react-loading-spin";
import toast, { Toaster } from "react-hot-toast";

import { Authentication } from "../database/authentication";
import { RegisterStatus } from "../database/database_util";

import validInputIcon from "../assets/page_design/valid_input_icon.png";
import invalidInputIcon from "../assets/page_design/invalid_input_icon.png";
import revealPasswordIcon from "../assets/page_design/reveal_password_icon.png";

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
    Authentication.register(
      {
        username: this.state.username,
        email: this.state.email,
        password: this.state.password,
      },
      (status: RegisterStatus) => {
        switch (status) {
          case RegisterStatus.success:
            {
              this.props.onSuccess();
            }
            break;
          case RegisterStatus.usernameTaken:
            {
              toast("This username is already taken");
              this.setState(() => {
                return { isWaitingForResponse: false };
              });
            }
            break;
          case RegisterStatus.emailRegistered:
            {
              toast("A user is already registered with this email address");
              this.setState(() => {
                return { isWaitingForResponse: false };
              });
            }
            break;
          case RegisterStatus.connectionError:
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
            width: 330,
            top: top,
            fontSize: 18,
            height: 60,
            lineHeight: 20,
          }}
        />
        {/* validity icon */}
        {value === "" ? (
          <div />
        ) : (
          <img
            style={{
              position: "absolute",
              left: 5,
              top: top + 25,
              width: 20,
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
              left: -80,
              top: top - 75,
              width: 180,
              height: 80,
              border: "2px solid #888",
              borderRadius: 15,
              background: "#000",
              color: "#ccc",
              padding: 5,
              fontSize: 14,
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
            top: top + 40,
            width: 385,
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
    let isConfirmPasswordValid = this.checkConfirmPasswordValidity(
      confirmPassword
    );
    // close popup if field becomes valid
    if (
      ((isUsernameValid || username === "") && shownRulesPopup == "Username") ||
      ((isEmailValid || email === "") && shownRulesPopup == "Email") ||
      ((isPasswordValid || password === "") && shownRulesPopup == "Password") ||
      ((isConfirmPasswordValid || confirmPassword === "") &&
        shownRulesPopup == "Confirm Password")
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
            fontSize: 40,
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: 40,
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
            170,
            isUsernameValid,
            "Username must be 3-20 characters long and can only contain letters, numbers, '_', '-', and '*'"
          )}
          {/* email */}
          {this.textInputField(
            "Email",
            email,
            this.setEmail,
            250,
            isEmailValid,
            "Must be a valid email address"
          )}
          {/* password */}
          {this.textInputField(
            "Password",
            password,
            this.setPassword,
            330,
            isPasswordValid,
            "Password must be at least 8 characters long and can only contain letters, numbers, '_', '-', and '*'"
          )}
          {/* confirm password */}
          {this.textInputField(
            "Confirm Password",
            confirmPassword,
            this.setConfirmPassword,
            410,
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
