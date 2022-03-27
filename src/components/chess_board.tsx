import * as React from "react";
import Box from "@mui/material/Box";
import { Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
//import styles from "./chess_board.module.css";

interface BoardComponentProps {
  size: number;
  lightColor: string;
  darkColor: string;
}

interface BoardComponentState {}

class BoardComponent extends React.Component<
  BoardComponentProps,
  BoardComponentState
> {
  //state = { :  }

  constructor(props: BoardComponentProps) {
    super(props);
  }

  render() {
    let { size, lightColor, darkColor } = this.props;
    return (
      <Box
        sx={{
          width: size,
          height: size,
        }}
      >
        <div className="row">
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.main",
            }}
          />
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.dark",
            }}
          />
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.main",
            }}
          />
        </div>
        <div className="row">
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.dark",
            }}
          />
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.main",
            }}
          />
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.dark",
            }}
          />
        </div>
        <div className="row">
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.main",
            }}
          />
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.dark",
            }}
          />
          <Box
            sx={{
              width: size / 3,
              height: size / 3,
              backgroundColor: "primary.main",
            }}
          />
        </div>
      </Box>
    );
  }
}

export default BoardComponent;
