import {
  User,
  Lobby,
  RegisterParams,
  RegisterStatus,
  LoginStatus,
  LoginResponse,
  RegisterResponse,
  LobbyParams,
  LobbyCreationResponse,
  LobbyCreationStatus,
  LobbyJoiningStatus,
  LobbyJoiningResponse,
} from "./database_util";

export class MongodbClient {
  register(
    user: RegisterParams,
    callback: (status: RegisterStatus, user: User) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/register";
    request.open("POST", url);
    request.send(JSON.stringify(user));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          let response: RegisterResponse = JSON.parse(
            JSON.parse(request.responseText)
          );
          callback(response.status, response.user);
        } else {
          callback(RegisterStatus.connectionError, null as any);
        }
      }
    };
  }

  login(
    usernameOrEmail: string,
    password: string,
    callback: (status: LoginStatus, user: User) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/login";
    request.open("POST", url);
    request.send(
      JSON.stringify({ usernameOrEmail: usernameOrEmail, password: password })
    );
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        if (request.status === 200) {
          let response: LoginResponse = JSON.parse(
            JSON.parse(request.responseText)
          );
          callback(response.status, response.user);
        } else {
          callback(LoginStatus.connectionError, null as any);
        }
      }
    };
  }

  createLobby(
    lobbyParams: LobbyParams,
    callback: (status: LobbyCreationStatus, gameID: string) => void
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
          callback(response.status, response.gameID);
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
          callback(
            JSON.parse(request.responseText).map(
              (databaseLobby: any, _: number) => {
                return {
                  id: databaseLobby["_id"],
                  name: databaseLobby["name"],
                  creatorName: databaseLobby["creatorName"],
                  password: databaseLobby["password"],
                  areTeamsPrearranged: databaseLobby["areTeamsPrearranged"],
                  memberIDs: databaseLobby["memberIDs"],
                } as Lobby;
              }
            )
          );
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
