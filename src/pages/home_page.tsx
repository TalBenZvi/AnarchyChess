import React from "react";
import whiteWallpaperImage from "../assets/page_design/home_wallpaper_image (white).png";
import blackWallpaperImage from "../assets/page_design/home_wallpaper_image (black).png";

function HomePage() {
  document.body.style.overflow = "hidden";
  return (
    <div
      style={{
        position: "absolute",
        backgroundColor: "#222222",
        width: "100%",
        height: "100%",
      }}
    >
      <div className="centered-title" style={{
        top: 20,
        fontSize: 130,
        color: "#ffffff",
        textShadow: "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000",
      }}>Anarchy Chess</div>
      <img style={{
        position: "absolute",
        left: -100,
        bottom: -200,
        height: 650,
        filter: `contrast(90%)`,   
      }} src={whiteWallpaperImage} />
      <img style={{
        position: "absolute",
        right: -60,
        bottom: -200,
        height: 650,
        filter: `contrast(92%)`,
      }} src={blackWallpaperImage} />
    </div>
  );
}

export default HomePage;
