import React from "react";

import whiteWallpaperImage from "../assets/page_design/home_wallpaper_image (white).png";
import blackWallpaperImage from "../assets/page_design/home_wallpaper_image (black).png";
import homeTitle from "../assets/page_design/home_title.png";
import AuthenticatedHomePage from "./authenticated_home_page";
import LoginForm from "../components/login_form";
import RegisterForm from "../components/register_form";
import { Authentication } from "../database/authentication";

enum ViewMode {
  login,
  register,
  authenticated,
}

interface HomePageProps {}

interface HomePageState {
  viewMode: ViewMode;
  hoveredMode: ViewMode;
}

class HomePage extends React.Component<HomePageProps, HomePageState> {
  state = {
    viewMode:
      Authentication.currentUser == null
        ? ViewMode.login
        : ViewMode.authenticated,
    hoveredMode: null as any,
  };

  render() {
    const socket = new WebSocket("wss://www.anarchychess.xyz/websocket_server");
    console.log("socket created");

    // Connection opened
    socket.addEventListener("open", (event) => {
      console.log("connection opened");
      socket.send("test message");
    });

    // Listen for messages
    socket.addEventListener("message", (event) => {
      console.log("Message from server ", event.data);
    });

    let { viewMode, hoveredMode } = this.state;
    document.body.style.overflow = "hidden";
    return viewMode === ViewMode.authenticated ? (
      <AuthenticatedHomePage />
    ) : (
      /* background */
      <div className="background">
        {/* title */}
        <img
          alt="Anarchy Chess"
          style={{
            position: "absolute",
            left: "50%",
            transform: "translate(-50%, 0%)",
            top: 10,
            height: 240,
          }}
          src={homeTitle}
        />
        {/* wallpaper images */}
        <img
          alt=""
          style={{
            position: "absolute",
            left: -100,
            bottom: -200,
            height: 650,
            filter: `contrast(90%)`,
          }}
          src={whiteWallpaperImage}
        />
        <img
          alt=""
          style={{
            position: "absolute",
            right: -60,
            bottom: -200,
            height: 650,
            filter: `contrast(92%)`,
          }}
          src={blackWallpaperImage}
        />
        {/* menu */}
        <div
          className="highlighted-area"
          style={{
            position: "fixed",
            width: 450,
            height: 580,
            top: 270,
            left: "50%",
            transform: "translate(-50%, 0%)",
          }}
        >
          {/* tabs */}
          <div className="row">
            {/* login tab */}
            <button
              onMouseEnter={() =>
                this.setState(() => {
                  return { hoveredMode: ViewMode.login };
                })
              }
              onMouseLeave={() =>
                this.setState(() => {
                  return { hoveredMode: null as any };
                })
              }
              onClick={() =>
                this.setState(() => {
                  return { viewMode: ViewMode.login };
                })
              }
              className="clear-button"
              style={{
                width: 225,
                height: 50,
                fontSize: 20,
                lineHeight: 3,
                color:
                  viewMode === ViewMode.login || hoveredMode === ViewMode.login
                    ? "#cccccc"
                    : "#808080",
              }}
            >
              Login
            </button>
            {/* register tab */}
            <button
              onMouseEnter={() =>
                this.setState(() => {
                  return { hoveredMode: ViewMode.register };
                })
              }
              onMouseLeave={() =>
                this.setState(() => {
                  return { hoveredMode: null as any };
                })
              }
              onClick={() =>
                this.setState(() => {
                  return { viewMode: ViewMode.register };
                })
              }
              className="clear-button"
              style={{
                width: 225,
                height: 50,
                fontSize: 20,
                lineHeight: 3,
                color:
                  viewMode === ViewMode.register ||
                  hoveredMode === ViewMode.register
                    ? "#cccccc"
                    : "#808080",
              }}
            >
              Register
            </button>
          </div>
          {/* divider */}
          <div className="row">
            <hr
              style={{
                width: 225,
                border: `1px solid ${
                  viewMode === ViewMode.login ? "#bb0000" : "#808080"
                }`,
              }}
            />
            <hr
              style={{
                width: 225,
                border: `1px solid ${
                  viewMode === ViewMode.register ? "#bb0000" : "#808080"
                }`,
              }}
            />
          </div>
          {/* form */}
          {viewMode === ViewMode.login ? (
            <LoginForm
              onSuccess={() =>
                this.setState({ viewMode: ViewMode.authenticated })
              }
            />
          ) : (
            <RegisterForm
              onSuccess={() =>
                this.setState({ viewMode: ViewMode.authenticated })
              }
            />
          )}
        </div>
      </div>
    );
  }
}

export default HomePage;
