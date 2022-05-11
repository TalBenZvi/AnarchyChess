import React from "react";
import whiteWallpaperImage from "../assets/page_design/home_wallpaper_image (white).png";
import blackWallpaperImage from "../assets/page_design/home_wallpaper_image (black).png";
import homeTitle from "../assets/page_design/home_title.png";
import LoginForm from "../components/login_form";
import RegisterForm from "../components/register_form";

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
    viewMode: ViewMode.register,
    hoveredMode: null as any,
  };

  render() {
    let { viewMode, hoveredMode } = this.state;
    document.body.style.overflow = "hidden";
    return (
      /* background */
      <div
        style={{
          position: "absolute",
          background:
            "linear-gradient(0deg, rgba(16,16,16,1) 0%, rgba(34,34,34,1) 12%, rgba(34,34,34,1) 75%, rgba(16,16,16,1) 100%)",
          width: "100%",
          height: "100%",
        }}
      >
        {/* title */}
        <img
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
          {viewMode === ViewMode.login ? <LoginForm/> : <RegisterForm/>}
        </div>
      </div>
    );
  }
}

export default HomePage;