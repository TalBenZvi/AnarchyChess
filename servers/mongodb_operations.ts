import axios from "axios";

import {
  Lobby,
  LoginResponse,
  RegisterResponse,
  LobbyParams,
  LobbyCreationResponse,
  LobbyCreationStatus,
  LobbyJoiningStatus,
  LobbyJoiningResponse,
  covertDatabaseLobby,
} from "./database_util.js";
import {
  LoginParams,
  LoginStatus,
  User,
  RegisterParams,
  RegisterStatus,
} from "../src/communication/communication_util.js";

export class MongodbOperations {
  private static sendRequestToDatabase(
    url: string,
    body: string,
    onSuccess: (responseText: string) => void,
    onFailure: (responseText: string) => void
  ) {
    axios
      .post(url, body, {
        headers: {
          Authorization: "Basic xxxxxxxxxxxxxxxxxxx",
          "Content-Type": "text/plain",
        },
      })
      .then((response) => {
        if (response.status === 200) {
          onSuccess(response.data.toString());
        } else {
          onFailure(response.data.toString());
        }
      });
  }

  static register(
    user: RegisterParams,
    callback: (status: RegisterStatus, user: User) => void
  ): void {
    this.sendRequestToDatabase(
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/register",
      JSON.stringify(user),
      (responseText: string) => {
        let response: RegisterResponse = JSON.parse(responseText);
        callback(response.status, response.user);
      },
      (responseText: string) => {
        callback(RegisterStatus.connectionError, null as any);
      }
    );
    // const request = new XMLHttpRequest();
    // const url =
    //   "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/register";
    // request.open("POST", url);
    // request.send(JSON.stringify(user));
    // request.onreadystatechange = (e) => {
    //   if (request.readyState === 4) {
    //     if (request.status === 200) {
    //       let response: RegisterResponse = JSON.parse(
    //         JSON.parse(request.responseText)
    //       );
    //       callback(response.status, response.user);
    //     } else {
    //       callback(RegisterStatus.connectionError, null as any);
    //     }
    //   }
    // };
  }

  static login(
    loginParams: LoginParams,
    callback: (status: LoginStatus, user: User) => void
  ): void {
    this.sendRequestToDatabase(
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/login",
      JSON.stringify(loginParams),
      (responseText: string) => {
        let response: LoginResponse = JSON.parse(responseText);
        callback(response.status, response.user);
      },
      (responseText: string) => {
        callback(LoginStatus.connectionError, null as any);
      }
    );
  }

  static createLobby(
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

  static getLobbies(
    userID: string,
    callback: (lobbies: Lobby[]) => void
  ): void {
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

  static joinLobby(
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

  static updateLobbyMembers(lobbyID: string, memberIDs: string[]): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/updateLobbyMembers";
    request.open("POST", url);
    request.send(JSON.stringify({ lobbyID: lobbyID, memberIDs: memberIDs }));
  }
}
