import { WebSocketServer } from "ws";

import {} from "./database_util.js";
import {
  replacer,
  reviver,
  WSRequest,
  WSRequestType,
  WSResponse,
  WSResponseInfo,
  WSS_PATH,
  LoginParams,
  LoginStatus,
  User,
  RegisterParams,
  RegisterStatus,
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
                this.login(client, request.params as LoginParams);
              }
              break;
            case WSRequestType.register:
              {
                this.register(client, request.params as RegisterParams);
              }
              break;
          }
        }
      });
    });
  }

  private login(client: any, loginParams: LoginParams) {
    MongodbOperations.login(loginParams, (status: LoginStatus, user: User) => {
      if (status === LoginStatus.success) {
        this.connectedUsers.set(client, user);
      }
      client.send(
        JSON.stringify(
          {
            type: WSRequestType.login,
            status: status,
            info: new Map<WSResponseInfo, any>([[WSResponseInfo.user, user]]),
          } as WSResponse,
          replacer
        )
      );
    });
  }

  private register(client: any, registerParams: RegisterParams) {
    MongodbOperations.register(
      registerParams,
      (status: RegisterStatus, user: User) => {
        if (status === RegisterStatus.success) {
          this.connectedUsers.set(client, user);
        }
        client.send(
          JSON.stringify(
            {
              type: WSRequestType.register,
              status: status,
              info: new Map<WSResponseInfo, any>([[WSResponseInfo.user, user]]),
            } as WSResponse,
            replacer
          )
        );
      }
    );
  }
}
