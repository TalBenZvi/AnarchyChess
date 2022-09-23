import axios from "axios";

import {
  LoginResponse,
  RegisterResponse,
  LobbyJoiningStatus,
  LobbyJoiningResponse,
} from "./database_util.js";
import {
  LoginParams,
  WSResponseStatus,
  User,
  Lobby,
  RegisterParams,
  LobbyCreationParams,
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
    callback: (status: WSResponseStatus, user: User) => void
  ): void {
    this.sendRequestToDatabase(
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/register",
      JSON.stringify(user),
      (responseText: string) => {
        let response: RegisterResponse = JSON.parse(responseText);
        callback(response.status, response.user);
      },
      (responseText: string) => {
        callback(WSResponseStatus.connectionError, null as any);
      }
    );
  }

  static login(
    loginParams: LoginParams,
    callback: (status: WSResponseStatus, user: User) => void
  ): void {
    this.sendRequestToDatabase(
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/login",
      JSON.stringify(loginParams),
      (responseText: string) => {
        let response: LoginResponse = JSON.parse(responseText);
        callback(response.status, response.user);
      },
      (responseText: string) => {
        callback(WSResponseStatus.connectionError, null as any);
      }
    );
  }
}
