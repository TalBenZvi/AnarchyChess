import React from "react";

import whiteWallpaperImage from "../assets/page_design/home_wallpaper_image (white).png";
import blackWallpaperImage from "../assets/page_design/home_wallpaper_image (black).png";
import homeTitle from "../assets/page_design/home_title.png";
import AuthenticatedHomePage from "./authenticated_home_page";
import LoginForm from "../components/login_form";
import RegisterForm from "../components/register_form";
import {
  Environment,
  EnvironmentManager,
  WEBSITE_DOMAIN,
} from "../communication/communication_util";
import { ClientActionCenter } from "../client_side/client_action_center";

enum ViewMode {
  login,
  register,
  authenticated,
}

interface HomePageProps {}

interface HomePageState {
  viewMode: ViewMode;
  hoveredMode: ViewMode;
  windowWidth: number;
  windowHeight: number;
}

class HomePage extends React.Component<HomePageProps, HomePageState> {
  state = {
    viewMode: ViewMode.login,
    hoveredMode: null as any,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
  };

  constructor(props: HomePageProps) {
    super(props);
  }

  componentDidMount() {
    this.updateWindowDimensions();
    window.addEventListener("resize", this.updateWindowDimensions);
    if (ClientActionCenter.getInstance().currentUser !== null) {
      this.setState({ viewMode: ViewMode.authenticated });
    }
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.updateWindowDimensions);
  }

  updateWindowDimensions = () => {
    this.setState({
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
    });
  };

  render() {
    let { viewMode, hoveredMode, windowWidth, windowHeight } = this.state;
    let fontSize: number = windowHeight * 0.026;
    document.body.style.overflow = "hidden";
    return viewMode === ViewMode.authenticated ? (
      <AuthenticatedHomePage
        windowWidth={windowWidth}
        windowHeight={windowHeight}
      />
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
            top: "3%",
            height: windowHeight * 0.25,
          }}
          src={homeTitle}
        />
        {/* wallpaper images */}
        <img
          alt=""
          style={{
            position: "absolute",
            left: "-5%",
            bottom: "-20%",
            height: windowHeight * 0.7,
            filter: `contrast(90%)`,
          }}
          src={whiteWallpaperImage}
        />
        <img
          alt=""
          style={{
            position: "absolute",
            right: "-3%",
            bottom: "-20%",
            height: windowHeight * 0.7,
            filter: `contrast(92%)`,
          }}
          src={blackWallpaperImage}
        />
        {/* menu */}
        <div
          className="highlighted-area"
          style={{
            position: "fixed",
            width: windowWidth * 0.23,
            height: windowHeight * 0.65,
            top: "30%",
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
                height: windowHeight * 0.05,
                fontSize: "1.3vw",
                lineHeight: 1.95,
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
                height: windowHeight * 0.05,
                fontSize: "1.3vw",
                lineHeight: 1.95,
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
