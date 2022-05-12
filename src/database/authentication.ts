import { User, RegisterStatus, LoginStatus } from "./database_util";
import { MongodbClient  } from "../database/mongodb_client";

export class Authentication {
  static currentUser: User = null as any;
  static mongodbClient: MongodbClient = new MongodbClient();

  static register(
    user: User,
    callback: (isSuccessfull: boolean, status: RegisterStatus) => void
  ) {
    Authentication.mongodbClient.register(
      user,
      (isSuccessfullClient: boolean, status: RegisterStatus) => {
        if (isSuccessfullClient) {
          Authentication.currentUser = user;
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
      (isSuccessfullClient: boolean, status: LoginStatus) => {
        if (isSuccessfullClient) {
          Authentication.currentUser = {username: "lorem ipsum", email: "dolor sit amet"};
        }
        callback(isSuccessfullClient, status);
      }
    );
  }
}
