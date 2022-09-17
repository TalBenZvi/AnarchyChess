import { WebSocketServer } from "ws";

import {
  LoginParams,
  LoginStatus,
  User,
} from "../src/database/database_util.js";
import {
  replacer,
  reviver,
  WSRequest,
  WSRequestType,
  WSResponse,
  WSResponseInfo,
  WSS_PATH,
} from "../src/communication/communication_util.js";
import { MongodbOperations } from "./mongodb_operations.js";

export class AppServer {
  private wss;
  private connectedUsers: Map<any, User>;

  constructor(server: any) {
    this.wss = new WebSocketServer({ server: server, path: WSS_PATH });
    this.connectedUsers = new Map();
    this.wss.on("connection", (client) => {
      client.on("message", (data) => {
        let request: WSRequest = JSON.parse(data.toString(), reviver);
        if (request !== undefined) {
          switch (request.type) {
            case WSRequestType.login:
              {
                let loginParams: LoginParams = request.params;
                MongodbOperations.login(
                  loginParams,
                  (status: LoginStatus, user: User) => {
                    if (status === LoginStatus.success) {
                      this.connectedUsers.set(client, user);
                    }
                    client.send(
                      JSON.stringify(
                        {
                          type: WSRequestType.login,
                          status: status,
                          info: new Map<WSResponseInfo, any>([
                            [WSResponseInfo.user, user],
                          ]),
                        } as WSResponse,
                        replacer
                      )
                    );
                  }
                );
              }
              break;
          }
        }
      });
    });
  }

  private login(client: any, loginParams: LoginParams) {
    MongodbOperations.login(loginParams, (status: LoginStatus, user: User) => {
      switch (status) {
        case LoginStatus.success:
          {
          }
          break;
        case LoginStatus.failure:
          {
          }
          break;
        case LoginStatus.connectionError:
          {
          }
          break;
      }
    });
  }
}
