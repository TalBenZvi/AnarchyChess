import * as React from "react";
import { Redirect } from "react-router";

import homeTitle from "../assets/page_design/home_title.png";
import { ClientActionCenter } from "../client_side/client_action_center";

interface NavBarProps {
  currentRoute: string;
}

interface NavBarState {
  redirectAddress: string;
}

class NavBar extends React.Component<NavBarProps, NavBarState> {
  clientActionCenter = ClientActionCenter.getInstance();
  state = { redirectAddress: null as any };

  render() {
    let { redirectAddress } = this.state;
    let { currentRoute } = this.props;
    if (redirectAddress != null && redirectAddress !== currentRoute) {
      return <Redirect push to={redirectAddress} />;
    }
    return (
      <div
        style={{
          position: "absolute",
          width: "100%",
          height: 100,
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
            // Authentication.leaveLobby();
            // Authentication.closeLobby();
            // this.setState({ redirectAddress: "/" });
          }}
          alt="logo"
        />
        {/* username */}
        <div
          className="navbar-title"
          style={{
            right: "3%",
          }}
        >
          {this.clientActionCenter.currentUser.username}
        </div>
        {/* logout button */}
        <button
          className="navbar-button"
          style={{
            verticalAlign: "middle",
            right: "12%",
          }}
          onClick={() => {
            this.clientActionCenter.logout();
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
