import * as React from "react";
import {
  RecyclerListView,
  DataProvider,
  LayoutProvider,
} from "recyclerlistview/web";
import { PieceColor } from "../game_flow_util/game_elements";
import { ClientFlowEngine } from "../client_side/client_flow_engine";

const WHITE_COLOR: string = "#dddddd";
const BLACK_COLOR: string = "#333333";

interface MoveListItem {
  color: PieceColor;
  san: string;
}

interface MoveListProps {
  width: number;
  height: number;
  rowHeight: number;
  lightColor: string;
  darkColor: string;
  clientFlowEngine: ClientFlowEngine;
}

interface MoveListState {
  dataProvider: DataProvider;
  moveListItems: MoveListItem[];
}

class MoveList extends React.Component<MoveListProps, MoveListState> {
  state = {
    dataProvider: new DataProvider((r1, r2) => r1 !== r2),
    moveListItems: [],
  };
  layoutProvider: LayoutProvider = new LayoutProvider(
    (index) => {
      return index;
    },
    (type, dimension) => {
      dimension.width = this.props.width;
      dimension.height = this.props.rowHeight + 2;
    }
  );

  constructor(props: MoveListProps) {
    super(props);
    //props.clientFlowEngine.moveList = this;
  }

  rowRenderer = (type: any, item: MoveListItem) => {
    let { width, rowHeight, lightColor, darkColor } = this.props;
    //width = width + 30;
    let fontSize: number = rowHeight * 0.7;
    return (
      <div>
        <div className="row">
          <div
            style={{
              width: width * 0.5,
              height: rowHeight,
              backgroundColor: lightColor,
              color: darkColor,
              fontSize: fontSize,
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: width / 2,
                top: 5,
                textAlign: "center",
              }}
            >
              move
            </div>
          </div>
          <div
            style={{
              width: width / 2,
              height: rowHeight,
              backgroundColor: darkColor,
              color: lightColor,
              fontSize: fontSize,
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: width / 2,
                top: 5,
                textAlign: "center",
              }}
            >
              move
            </div>
          </div>
        </div>
        <hr style={{
            backgroundColor: "red",
        }}/>
      </div>
    );
  };

  componentDidMount() {
    this.setState(() => {
      return {
        dataProvider: this.state.dataProvider.cloneWithRows(
          [...Array(20)].map((_, i) => ({
            color: PieceColor.white,
            san: i.toString(),
          }))
        ),
        moveListItems: [...Array(20)].map((_, i) => ({
          color: PieceColor.white,
          san: i.toString(),
        })),
      };
    });
  }

  render() {
    let fontSize: number = this.props.rowHeight * 0.7;
    return (
      <div
        style={{
          width: this.props.width,
          height: this.props.height,
          backgroundColor: BLACK_COLOR,
        }}
      >
        <div className="row">
          <div
            style={{
              width: this.props.width / 2,
              height: this.props.rowHeight,
              backgroundColor: WHITE_COLOR,
              color: BLACK_COLOR,
              fontSize: fontSize,
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: this.props.width / 2,
                top: 5,
                textAlign: "center",
              }}
            >
              White
            </div>
          </div>
          <div
            style={{
              width: this.props.width / 2,
              height: this.props.rowHeight,
              backgroundColor: BLACK_COLOR,
              color: WHITE_COLOR,
              fontSize: fontSize,
              textAlign: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                width: this.props.width / 2,
                top: 5,
                textAlign: "center",
              }}
            >
              Black
            </div>
          </div>
        </div>
        <div
          style={{
            width: this.props.width * 1.05,
            height: this.props.height - this.props.rowHeight,
            flex: 1,
          }}
        >
          <RecyclerListView
            dataProvider={this.state.dataProvider}
            layoutProvider={this.layoutProvider}
            rowRenderer={this.rowRenderer}
          ></RecyclerListView>
        </div>
      </div>
    );
  }
}

export default MoveList;
