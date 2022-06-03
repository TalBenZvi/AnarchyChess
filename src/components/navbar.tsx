import * as React from "react";
import { Redirect } from "react-router";

import homeTitle from "../assets/page_design/home_title.png";
import { Authentication } from "../database/authentication";

interface NavBarProps {
  currentRoute: string;
}

interface NavBarState {
  redirectAddress: string;
}

class NavBar extends React.Component<NavBarProps, NavBarState> {
  state = { redirectAddress: null as any };

  render() {
    let { redirectAddress } = this.state;
    let { currentRoute } = this.props;
    if (redirectAddress != null && redirectAddress != currentRoute) {
      return <Redirect push to={redirectAddress} />;
    }
    return (
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: 100,
          //background: "#333",
          color: "ccc",
          zIndex: 0,
        }}
      >
        {/* logo */}
        <img
          style={{
            position: "absolute",
            top: 10,
            height: 80,
            cursor: "pointer",
          }}
          src={homeTitle}
          onClick={() => {
            Authentication.leaveLobby();
            Authentication.closeLobby();
            this.setState({ redirectAddress: "/" });
          }}
        />
        {/* username */}
        <div
          className="navbar-title"
          style={{
            right: "3%",
          }}
        >
          {Authentication.currentUser.username}
        </div>
        {/* logout button */}
        <button
          className="navbar-button"
          style={{
            right: "9%",
          }}
          onClick = {() => {
            Authentication.logout();
            window.location.reload();
          }}
        >
          Log out
        </button>
      </div>
    );
  }
}

export default NavBar;
