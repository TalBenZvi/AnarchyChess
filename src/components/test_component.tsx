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
            this.setState((state, props) => {
              root.style.setProperty('--prev', state.x.toString() + "px");
              root.style.setProperty('--current', (state.x + 50).toString() + "px");
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
