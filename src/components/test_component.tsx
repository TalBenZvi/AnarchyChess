import React, { Component } from "react";

import Gun from "gun";

export default class TestComponent extends Component {
  gun: any;
  state = { data: 0, result: "" };

  constructor(props: any) {
    super(props);
    this.gun = Gun({
      peers: ["http://localhost:3030/gun"],
    });


    this.gun.get("newerQuery").map().on((result: any) => {
      this.setState(() => {
        return {result: result.data}
      })
    })
  }

  render() {
    return (
      <div>
        <p>test</p>
        <p>{`data: ${this.state.data}`}</p>
        <button
          onClick={() => {
            this.setState(() => {
              return { data: this.state.data + 1 };
            });
          }}
        >
          increment
        </button>
        <button
          onClick={() => {
            this.setState(() => {
              return { data: this.state.data - 1 };
            });
          }}
        >
          decrement
        </button>
        <button
          onClick={async () => {
            while(true) {
              this.gun.get("newerQuery").set({ data: this.state.data });
              await new Promise(f => setTimeout(f, 2000));
              this.setState(() => {
                return { data: this.state.data + 1 };
              });
            } 
          }}
        >
          send data
        </button>
        <p>{this.state.result}</p>
      </div>
    );
  }
}
