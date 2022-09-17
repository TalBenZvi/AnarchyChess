import {
  EnvironmentManager,
  ValueType,
  LoginStatus,
  User,
  reviver,
  WSResponse,
  WSRequestType,
  WSResponseInfo,
  WSRequest,
  replacer,
} from "../communication/communication_util";
import { LoginParams } from "../database/database_util";

// in seconds
const RESPONSE_TIMEOUT: number = 10;

export class ClientActionCenter {
  private static instance: ClientActionCenter = null as any;
  private wsClient: WebSocket;

  private currentUser: User = null as any;

  private onLoginResponse: (status: LoginStatus, user: User) => void =
    null as any;
  private loginTimeout: any = null;

  static getInstance() {
    if (ClientActionCenter.instance === null) {
      ClientActionCenter.instance = new ClientActionCenter();
    }
    return ClientActionCenter.instance;
  }

  private constructor() {
    this.wsClient = new WebSocket(
      EnvironmentManager.getValue(ValueType.wssAddress)
    );
    this.wsClient.addEventListener("message", (event) => {
      let wsResponse: WSResponse = JSON.parse(event.data.toString(), reviver);
      switch (wsResponse.type) {
        case WSRequestType.login:
          {
            clearTimeout(this.loginTimeout);
            let user = wsResponse.info.get(WSResponseInfo.user);
            if (wsResponse.status === LoginStatus.success) {
              this.currentUser = user;
            }
            if (this.onLoginResponse !== null) {
              this.onLoginResponse(wsResponse.status, user);
              this.onLoginResponse = null as any;
            }
          }
          break;
      }
    });
  }

  login(
    loginParams: LoginParams,
    onResponse: (status: LoginStatus, user: User) => void
  ) {
    this.onLoginResponse = onResponse;
    this.wsClient.send(
      JSON.stringify(
        {
          type: WSRequestType.login,
          params: loginParams,
        } as WSRequest,
        replacer
      )
    );
    this.loginTimeout = setTimeout(() => {
      onResponse(LoginStatus.connectionError, null as any);
    }, RESPONSE_TIMEOUT * 1000);
  }
}
