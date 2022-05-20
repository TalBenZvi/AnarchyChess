import {
  User,
  RegisterStatus,
  LoginStatus,
  LoginResponse,
  RegisterResponse,
  LobbyParams,
  LobbyCreationResponse,
  LobbyCreationStatus,
} from "./database_util";

export class MongodbClient {
  register(
    user: User,
    callback: (
      isSuccessfull: boolean,
      status: RegisterStatus,
      userID: string
    ) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/register";
    request.open("POST", url);
    request.send(JSON.stringify(user));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        let response: RegisterResponse = JSON.parse(
          JSON.parse(request.responseText)
        );
        callback(request.status === 200, response.status, response.userID);
      }
    };
  }

  login(
    usernameOrEmail: string,
    password: string,
    callback: (
      isSuccessfull: boolean,
      status: LoginStatus,
      userID: string
    ) => void
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
        let response: LoginResponse = JSON.parse(
          JSON.parse(request.responseText)
        );
        callback(request.status === 200, response.status, response.userID);
      }
    };
  }

  createLobby(
    lobbyParams: LobbyParams,
    callback: (
      isSuccessfull: boolean,
      status: LobbyCreationStatus,
    ) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/createLobby";
    request.open("POST", url);
    request.send(JSON.stringify(lobbyParams));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        let response: LobbyCreationResponse = JSON.parse(
          JSON.parse(request.responseText)
        );
        callback(request.status === 200, response.status);
      }
    };
  }
}
