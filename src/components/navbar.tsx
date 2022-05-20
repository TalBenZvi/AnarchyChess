import * as React from "react";
import homeTitle from "../assets/page_design/home_title.png";

interface NavBarProps {}

interface NavBarState {}

class NavBar extends React.Component<NavBarProps, NavBarState> {
  render() {
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
          }}
          src={homeTitle}
        />
      </div>
    );
  }
}

export default NavBar;
