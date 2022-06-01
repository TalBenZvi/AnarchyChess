import React from "react";

import GameStartScreen from "../components/game_start_screen"

interface TestPageProps {}

interface TestPageState {}

class TestPage extends React.Component<TestPageProps, TestPageState> {
  state = {};
  
  render() {
    return (
     <GameStartScreen clientFlowEngine={null as any}/>
    );
  }
}

export default TestPage;
