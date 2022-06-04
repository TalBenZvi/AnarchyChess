import { User } from "../database/database_util";
import { NUM_OF_PLAYERS, PieceColor, reverseColor } from "./game_elements";

interface Player {
  user: User;
  assignedColor: PieceColor;
}

interface PlayerListFields {
  areTeamsPrearranged: boolean;
  players: Player[];
}

export class PlayerList {
  private players: Player[] = [...Array(NUM_OF_PLAYERS)].map(() => ({
    user: null as any,
    assignedColor: null as any,
  }));

  constructor(private areTeamsPrearranged: boolean) {}

  setFromJSON(jsonString: string) {
    let playerListFields: PlayerListFields = JSON.parse(jsonString);
    this.areTeamsPrearranged = playerListFields.areTeamsPrearranged;
    this.players = playerListFields.players;
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
    if (this.areTeamsPrearranged) {
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

  removePlayer(userIndex: number): void {
    this.players[userIndex] = { user: null as any, assignedColor: null as any };
  }

  swapTeam(userIndex: number): void {
    if (this.areTeamsPrearranged) {
      this.players[userIndex].assignedColor = reverseColor(
        this.players[userIndex].assignedColor
      );
    }
  }
}
