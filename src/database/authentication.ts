import { User, RegisterStatus, LoginStatus, LobbyParams, LobbyCreationStatus } from "./database_util";
import { MongodbClient } from "../database/mongodb_client";

export class Authentication {
  //static currentUserID: string = null as any;
  static currentUserID: string = "627c0e2c5573d5400492587f";
  static mongodbClient: MongodbClient = new MongodbClient();

  static register(
    user: User,
    callback: (isSuccessfull: boolean, status: RegisterStatus) => void
  ) {
    Authentication.mongodbClient.register(
      user,
      (
        isSuccessfullClient: boolean,
        status: RegisterStatus,
        userID: string
      ) => {
        if (status === RegisterStatus.success) {
          Authentication.currentUserID = userID;
        }
        callback(isSuccessfullClient, status);
      }
    );
  }

  static login(
    usernameOrEmail: string,
    password: string,
    callback: (isSuccessfull: boolean, status: LoginStatus) => void
  ) {
    Authentication.mongodbClient.login(
      usernameOrEmail,
      password,
      (isSuccessfullClient: boolean, status: LoginStatus, userID) => {
        if (status === LoginStatus.success) {
          Authentication.currentUserID = userID;
        }
        callback(isSuccessfullClient, status);
      }
    );
  }

  static createLobby(
    lobbyParams: LobbyParams,
    callback: (isSuccessfull: boolean, status: LobbyCreationStatus) => void
  ) {
    Authentication.mongodbClient.createLobby(
      lobbyParams,
      (
        isSuccessfullClient: boolean,
        status: LobbyCreationStatus,
      ) => {
        callback(isSuccessfullClient, status);
      }
    );
  }
}
