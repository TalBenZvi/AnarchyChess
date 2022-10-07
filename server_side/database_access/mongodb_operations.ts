import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { LoginResponse, RegisterResponse } from "./database_util.js";
import {
  LoginParams,
  WSResponseStatus,
  User,
  RegisterParams,
  EnvironmentManager,
  ValueType,
} from "../../src/communication/communication_util.js";

export class MongodbOperations {
  private static sendRequestToDatabase(
    path: string,
    params: any,
    onSuccess: (responseText: string) => void,
    onFailure: (responseText: string) => void
  ) {
    axios
      .post(
        `https://data.mongodb-api.com/app/application-0-gqzvo/endpoint${path}`,
        JSON.stringify(params),
        {
          headers: {
            Authorization: "Basic xxxxxxxxxxxxxxxxxxx",
            "Content-Type": "text/plain",
          },
        }
      )
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
      "/register",
      user,
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
      "/login",
      loginParams,
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
