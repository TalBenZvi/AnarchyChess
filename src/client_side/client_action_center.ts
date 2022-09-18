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
  LoginParams,
  RegisterParams,
  RegisterStatus,
} from "../communication/communication_util";

// in seconds
const RESPONSE_TIMEOUT: number = 10;

export class ClientActionCenter {
  private static instance: ClientActionCenter = null as any;
  private wsClient: WebSocket;
  private _currentUser: User = null as any;

  // on-response functions
  private onLoginResponse: (status: LoginStatus, user: User) => void =
    null as any;
  private onRegisterResponse: (status: RegisterStatus, user: User) => void =
    null as any;

  //timeouts
  private loginTimeout: any = null;
  private registerTimeout: any = null;

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
        // register
        case WSRequestType.register:
          {
            clearTimeout(this.registerTimeout);
            let user = wsResponse.info.get(WSResponseInfo.user);
            if (wsResponse.status === LoginStatus.success) {
              this._currentUser = user;
            }
            if (this.onRegisterResponse !== null) {
              this.onRegisterResponse(
                wsResponse.status as RegisterStatus,
                user
              );
              this.onRegisterResponse = null as any;
            }
          }
          break;
        // login
        case WSRequestType.login:
          {
            clearTimeout(this.loginTimeout);
            let user = wsResponse.info.get(WSResponseInfo.user);
            if (wsResponse.status === LoginStatus.success) {
              this._currentUser = user;
            }
            if (this.onLoginResponse !== null) {
              this.onLoginResponse(wsResponse.status as LoginStatus, user);
              this.onLoginResponse = null as any;
            }
          }
          break;
      }
    });
  }

  get currentUser(): User {
    return this._currentUser;
  }

  register(
    registerParams: RegisterParams,
    onResponse: (status: RegisterStatus, user: User) => void
  ) {
    this.onRegisterResponse = onResponse;
    this.wsClient.send(
      JSON.stringify(
        {
          type: WSRequestType.register,
          params: registerParams,
        } as WSRequest,
        replacer
      )
    );
    this.registerTimeout = setTimeout(() => {
      onResponse(RegisterStatus.connectionError, null as any);
    }, RESPONSE_TIMEOUT * 1000);
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

  logout() {
    this.wsClient.close();
    this._currentUser = null as any;
  }
}
