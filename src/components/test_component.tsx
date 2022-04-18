import React, { Component } from "react";
import {
  RecyclerListView,
  DataProvider,
  LayoutProvider,
} from "recyclerlistview/web";

interface TestComponentProps {}

interface TestComponentState {
  dataProvider: DataProvider;
  data: number[];
}

export default class TestComponent extends Component {
  state = {
    dataProvider: null as any,
    data: [],
  };
  layoutProvider: LayoutProvider = new LayoutProvider(
    (index) => {
      return index;
    },
    (type, dimension) => {
      dimension.width = 500;
      dimension.height = 50;
    }
  );

  rowRenderer(type: any, item: any) {
    return <p style={{
      color: "red",
    }}>{item}</p>;
  }

  constructor(props: TestComponentProps) {
    super(props);
    this.state = {
      dataProvider: new DataProvider((r1, r2) => r1 !== r2),
      data: [],
    };
  }

  async fetchData() {
    this.setState(() => {
      return {
        dataProvider: this.state.dataProvider.cloneWithRows([...Array(20)].map((_, i) => i)),
        data: [...Array(20)].map((_, i) => i),
      };
    });
  }

  componentDidMount() {
    this.fetchData();
  }

  render() {
    return (
      <div style={{
        width: 500,
        height: 500,
        flex:1,
      }}>
        <RecyclerListView
          dataProvider={this.state.dataProvider}
          layoutProvider={this.layoutProvider}
          rowRenderer={this.rowRenderer}
        ></RecyclerListView>
      </div>
    );
  }
}

/*
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
*/
