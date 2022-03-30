import * as React from "react";
import { Component } from "react";

interface TestComponentProps {}

interface TestComponentState {
  x: number;
}

class TestComponent extends React.Component<
  TestComponentProps,
  TestComponentState
> {
  state = { x: 50 };
  render() {
    let root = document.documentElement;
    return (
      <div>
        <button
          onClick={() => {
            root.style.setProperty("--prev", this.state.x.toString() + "px");
            root.style.setProperty(
              "--current",
              (this.state.x + 50).toString() + "px"
            );
            this.setState((state, props) => {
              return { x: state.x + 50 };
            });
          }}
        >
          button
        </button>
        <div key={this.state.x} className="animated-div"></div>
        
      </div>
    );
  }
}

export default TestComponent;
