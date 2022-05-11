import { User, RegisterStatus } from "./database_util";
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
}
