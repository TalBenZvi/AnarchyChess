import {
  Lobby,
  LobbyParams,
  LobbyCreationResponse,
  LobbyCreationStatus,
  LobbyJoiningStatus,
  LobbyJoiningResponse,
  covertDatabaseLobby,
} from "./database_util";

export class MongodbClient {
  createLobby(
    lobbyParams: LobbyParams,
    callback: (status: LobbyCreationStatus, createdLobby: Lobby) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/createLobby";
    request.open("POST", url);
    request.send(JSON.stringify(lobbyParams));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          let response: LobbyCreationResponse = JSON.parse(
            JSON.parse(request.responseText)
          );
          callback(response.status, response.createdLobby);
        } else {
          callback(LobbyCreationStatus.connectionError, null as any);
        }
      }
    };
  }

  getLobbies(userID: string, callback: (lobbies: Lobby[]) => void): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/getLobbies";
    request.open("POST", url);
    request.send(JSON.stringify({ userID: userID }));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          callback(JSON.parse(request.responseText).map(covertDatabaseLobby));
        } else {
          callback([]);
        }
      }
    };
  }

  joinLobby(
    userID: string,
    lobbyID: string,
    callback: (status: LobbyJoiningStatus, serverIndex: number) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/joinLobby";
    request.open("POST", url);
    request.send(JSON.stringify({ userID: userID, lobbyID: lobbyID }));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          let response: LobbyJoiningResponse = JSON.parse(
            JSON.parse(request.responseText)
          );
          callback(response.status, response.serverIndex);
        } else {
          callback(LobbyJoiningStatus.connectionError, null as any);
        }
      }
    };
  }

  updateLobbyMembers(lobbyID: string, memberIDs: string[]): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/updateLobbyMembers";
    request.open("POST", url);
    request.send(JSON.stringify({ lobbyID: lobbyID, memberIDs: memberIDs }));
  }
}
