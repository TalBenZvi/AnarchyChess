import * as React from "react";
import { Redirect } from "react-router";

import homeTitle from "../assets/page_design/home_title.png";

interface NavBarProps {
  currentRoute: string;
}

interface NavBarState {
  redirectAddress: string
}

class NavBar extends React.Component<NavBarProps, NavBarState> {
  state = {redirectAddress: null as any}

  render() {
    let {redirectAddress} = this.state;
    let {currentRoute} = this.props;
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
        <img
          style={{
            position: "absolute",
            top: 10,
            height: 80,
            cursor: "pointer",
          }}
          src={homeTitle}
          onClick = {() => {
            this.setState({redirectAddress: "/"})
          }}
        />
      </div>
    );
  }
}

export default NavBar;
