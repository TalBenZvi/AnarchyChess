import React from "react";
import Peer from "peerjs";

interface TestPageProps {}

interface TestPageState {}

class TestPage extends React.Component<TestPageProps, TestPageState> {
  state = {};
  peer1: any = null;
  peer2: any = null;

  render() {
    return (
      <div>
        <button
          onClick={() => {
            this.peer1 = new Peer("client-1", {
              host: "localhost",
              port: 9000,
              path: "/myapp",
            });
            this.peer1.on("connection", (conn: any) => {
              console.log("received connection");
              conn.on("data", (data: any) => {
                console.log(data);
              });
              conn.on("open", () => {
                conn.send("hello!");
              });
            });
          }}
        >
          client 1
        </button>
        <button
          onClick={() => {
            this.peer2 = new Peer("client-2", {
              host: "localhost",
              port: 9000,
              path: "/myapp",
            });
            const conn = this.peer2.connect("client-1");
            console.log("sent connection");
            conn.on("open", () => {
              console.log("sending hi");
              conn.send("hi!");
            });
          }}
        >
          client 2
        </button>
      </div>
    );
  }
}

export default TestPage;
