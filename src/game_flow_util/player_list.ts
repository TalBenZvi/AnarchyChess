import { User } from "../database/database_util";
import { shuffle } from "./communication";
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
    let playerListFields: PlayerListFields = JSON.parse(jsonString);
    this._areTeamsPrearranged = playerListFields._areTeamsPrearranged;
    this.players = playerListFields.players;
  }

  get areTeamsPrearranged(): boolean {
    return this._areTeamsPrearranged;
  }

  getUserAt(userIndex: number): User {
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

  setPlayer(userIndex: number, user: User): void {
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
    this.players[userIndex] = { user: user, assignedColor: assignedColor };
  }

  indexOf(user: User): number {
    for (let i = 0; i < this.players.length; i++) {
      if (this.players[i].user != null && this.players[i].user.id === user.id) {
        return i;
      }
    }
    return -1;
  }

  removePlayerAtIndex(userIndex: number): void {
    this.players[userIndex] = { user: null as any, assignedColor: null as any };
  }

  removePlayer(user: User) {
    let userIndex: number = this.indexOf(user);
    if (userIndex !== -1) {
      this.removePlayerAtIndex(userIndex);
    }
  }

  changePlayerTeam(player: User): void {
    if (this._areTeamsPrearranged) {
      let userIndex: number = this.indexOf(player);
      if (
        userIndex !== -1 &&
        this.getUsersByAssignedColor(this.players[userIndex].assignedColor)
          .length <
          NUM_OF_PLAYERS / 2
      ) {
        this.players[userIndex].assignedColor = reverseColor(
          this.players[userIndex].assignedColor
        );
      }
    }
  }

  generateRoleAssignments(): number[] {
    //temp
    return [9, ...[...Array(31)].map((_, i: number) => {
      return i < 9 ? i : i + 1;
    })];
    if (
      this._areTeamsPrearranged &&
      this.getUsersByAssignedColor(PieceColor.white).length ==
        NUM_OF_PLAYERS / 2 &&
      this.getUsersByAssignedColor(PieceColor.black).length ==
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
            (_, i: number) => i + NUM_OF_PLAYERS
          ),
        ],
      ]);
      shuffle(playerIndicesByColor.get(PieceColor.white) as number[]);
      shuffle(playerIndicesByColor.get(PieceColor.black) as number[]);
      let roleAssignments: number[] = [];
      for (let player of this.players) {
        roleAssignments.push(
          (playerIndicesByColor.get(player.assignedColor) as number[])[0]
        );
        (playerIndicesByColor.get(player.assignedColor) as number[]).shift();
      }
      return [...roleAssignments];
    } else if (
      !this._areTeamsPrearranged &&
      this.getConnectedUsers().length == NUM_OF_PLAYERS
    ) {
      let roleAssignments: number[] = [...Array(NUM_OF_PLAYERS)].map(
        (_, i: number) => i
      );
      shuffle(roleAssignments);
      return [...roleAssignments];
    } else {
      return null as any;
    }
  }
}
