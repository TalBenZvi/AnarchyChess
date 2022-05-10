import * as React from "react";

interface RegisterFormProps {}

interface RegisterFormState {
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

class RegisterForm extends React.Component<
  RegisterFormProps,
  RegisterFormState
> {
  state = { userName: "", email: "", password: "", confirmPassword: "" };

  handleChange = (event: any) => {
    this.setState({userName: event.target.value});
  }

  handleSubmit = (event: any) => {
    alert('A name was submitted: ' + this.state.userName);
    event.preventDefault();
  }

  render() {
    return (
      <form onSubmit={this.handleSubmit}>
        <label>
          Name:
          <input type="text" value={this.state.userName} onChange={this.handleChange} />
        </label>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

export default RegisterForm;
