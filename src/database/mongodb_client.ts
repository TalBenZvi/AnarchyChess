import { User, RegisterStatus, LoginStatus } from "./database_util";

export class MongodbClient {
  register(
    user: User,
    callback: (isSuccessfull: boolean, status: RegisterStatus) => void
  ): void {
    const request = new XMLHttpRequest();
    const url =
      "https://data.mongodb-api.com/app/application-0-gqzvo/endpoint/register";
    request.open("POST", url);
    request.send(JSON.stringify(user));
    request.onreadystatechange = (e) => {
      if (request.readyState === 4) {
        callback(
          request.status === 200,
          parseInt(
            request.responseText.substr(1, request.responseText.length - 1)
          )
        );
      }
    };
  }

  login(
    usernameOrEmail: string,
    password: string,
    callback: (isSuccessfull: boolean, status: LoginStatus) => void
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
        callback(
          request.status === 200,
          parseInt(
            request.responseText.substr(1, request.responseText.length - 1)
          )
        );
      }
    };
  }
}
