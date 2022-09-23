import { reviver, shuffle, User } from "../communication/communication_util";
import { NUM_OF_PLAYERS, PieceColor, reverseColor } from "./game_elements";

interface Player {
  user: User;
  assignedColor: PieceColor;
}

interface PlayerListFields {
  _areTeamsPrearranged: boolean;
  players: Player[];
}

export class PlayerList {
  private players: Player[] = [...Array(NUM_OF_PLAYERS)].map(() => ({
    user: null as any,
    assignedColor: null as any,
  }));

  constructor(private _areTeamsPrearranged: boolean) {}
  
  setFromJSON(jsonString: string) {
    if (jsonString !== null) {
      let playerListFields: PlayerListFields = JSON.parse(jsonString, reviver);
      this._areTeamsPrearranged = playerListFields._areTeamsPrearranged;
      this.players = playerListFields.players;
    }
  }

  get areTeamsPrearranged(): boolean {
    return this._areTeamsPrearranged;
  }

  private getUserAt(userIndex: number): User {
    return this.players[userIndex].user;
  }

  getAllUsers(): User[] {
    return this.players.map((player: Player) => player.user);
  }

  getConnectedUsers() {
    return this.getAllUsers().filter((user: User) => user != null);
  }

  getUsersByAssignedColor(color: PieceColor): User[] {
    return this.players
      .filter((player: Player) => player.assignedColor === color)
      .map((player: Player) => player.user);
  }

  // returns whether or not the operation wad successfull
  addPlayer(user: User): boolean {
    let assignedColor = null as any;
    if (this._areTeamsPrearranged) {
      let whiteTeamSize: number = this.getUsersByAssignedColor(
        PieceColor.white
      ).length;
      let blackTeamSize: number = this.getUsersByAssignedColor(
        PieceColor.black
      ).length;
      assignedColor =
        whiteTeamSize > blackTeamSize ? PieceColor.black : PieceColor.white;
    }
    for (let i = 0; i < NUM_OF_PLAYERS; i++) {
      if (this.players[i].user === null) {
        this.players[i] = {
          user: user,
          assignedColor: assignedColor,
        } as Player;
        return true;
      }
    }
    return false;
  }

  private indexOf(userID: string): number {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].user != null && this.players[i].user.id === userID) {
        return i;
      }
    }
    return -1;
  }

  private removePlayerAtIndex(userIndex: number): void {
    this.players[userIndex] = { user: null as any, assignedColor: null as any };
  }

  removePlayer(userID: string) {
    let userIndex: number = this.indexOf(userID);
    if (userIndex !== -1) {
      this.removePlayerAtIndex(userIndex);
    }
  }

  changePlayerTeam(playerID: string): void {
    if (this._areTeamsPrearranged) {
      let userIndex: number = this.indexOf(playerID);
      if (
        userIndex !== -1 &&
        this.getUsersByAssignedColor(
          reverseColor(this.players[userIndex].assignedColor)
        ).length <
          NUM_OF_PLAYERS / 2
      ) {
        this.players[userIndex].assignedColor = reverseColor(
          this.players[userIndex].assignedColor
        );
      }
    }
  }

  // maps user id to the user's player index
  generateRoleAssignments(): Map<string, number> {
    //temp
    // return [
    //   14, 21, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19,
    //   20, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31,
    // ];
    if (
      this._areTeamsPrearranged &&
      this.getUsersByAssignedColor(PieceColor.white).length ===
        NUM_OF_PLAYERS / 2 &&
      this.getUsersByAssignedColor(PieceColor.black).length ===
        NUM_OF_PLAYERS / 2
    ) {
      let playerIndicesByColor: Map<PieceColor, number[]> = new Map([
        [
          PieceColor.white,
          [...Array(NUM_OF_PLAYERS / 2)].map((_, i: number) => i),
        ],
        [
          PieceColor.black,
          [...Array(NUM_OF_PLAYERS / 2)].map(
            (_, i: number) => i + NUM_OF_PLAYERS / 2
          ),
        ],
      ]);
      shuffle(playerIndicesByColor.get(PieceColor.white) as number[]);
      shuffle(playerIndicesByColor.get(PieceColor.black) as number[]);
      let roleAssignments: Map<string, number> = new Map();
      for (let player of this.players) {
        roleAssignments.set(
          player.user.id,
          (playerIndicesByColor.get(player.assignedColor) as number[])[0]
        );
        (playerIndicesByColor.get(player.assignedColor) as number[]).shift();
      }
      return roleAssignments;
    } else if (
      !this._areTeamsPrearranged &&
      this.getConnectedUsers().length === NUM_OF_PLAYERS
    ) {
      let roleAssignments: Map<string, number> = new Map();
      let roles: number[] = [...Array(NUM_OF_PLAYERS)].map((_, i: number) => i);
      shuffle(roles);
      for (let i = 0; i < NUM_OF_PLAYERS; i++) {
        roleAssignments.set(this.getUserAt(i).id, roles[i]);
      }
      return roleAssignments;
    } else {
      return null as any;
    }
  }
}
