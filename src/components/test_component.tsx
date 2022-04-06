import React, { Component } from "react";

import Gun from "gun";

export default class TestComponent extends Component {
  gun: any;
  david: any;
  queryGun = null
  state = { data: 0, result: "" };

  constructor(props: any) {
    super(props);
    this.gun = Gun({
      peers: ["http://localhost:3030/gun"],
    });

    let people = this.gun.get("people");

    people.set({ name: "jeff7" });

    this.david = this.gun.get("david").set({ id: 0, name: "david4" });

    //this.queryGun = this.gun.get("newQuery").set({ data: "zoe0" });

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
          onClick={() => {
            let result = "";
            let i = 0;
            /*
            (this.queryGun as any).once((data: any) => {
              //console.log(i.toString() + " " + JSON.stringify(data.name));
              i++;
              this.setState(() => {
                return { result: data.name };
              });
            });
            */
            this.gun.get("newerQuery").map().once((result: any) => {
              this.setState(() => {
                return {result: result.data}
              })
            })
          }}
        >
          query
        </button>
        <button
          onClick={() => {
            this.gun.get("newerQuery").set({ data: this.state.data });
          }}
        >
          send data
        </button>
        <p>{this.state.result}</p>
      </div>
    );
  }
}
