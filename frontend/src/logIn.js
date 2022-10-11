import React, { Component } from "react";
import "./logIn.css";
import {Link} from "react-router-dom";

let registerLink = "/register";

const mouseClickEvents = ['mousedown', 'click', 'mouseup'];
function simulateMouseClick(element){
  mouseClickEvents.forEach(mouseEventType =>
    element.dispatchEvent(
      new MouseEvent(mouseEventType, {
          view: window,
          bubbles: true,
          cancelable: true,
          buttons: 1
      })
    )
  );
}

export default class LogIn extends Component {
  constructor(props) {
    super(props);
    this.state = {username: '', password: '', username_error: '', password_error: ''};

    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handlePasswordChange = this.handlePasswordChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUsernameChange(event) {
    let state = this.state;
    state.username = event.target.value;
    this.setState(state);
  }

  handlePasswordChange(event) {
    let state = this.state;
    state.password = event.target.value;
    this.setState(state);
  }

  handleSubmit(event) {
    if (this.state.username.length <= 0) {
      alert('login jest za krótki!');
      return;
    }
    if (this.state.username.length > 20) {
      alert('login jest za długi!');
      return;
    }
    if (this.state.password.length <= 0) {
      alert('hasło jest za krótkie!');
      return;
    }
    if (this.state.password.length > 1000) {
      alert('hasło jest za długie!');
      return;
    }

    fetch('/api/auth/signin', {
      method: 'post',
      credentials: "same-origin",
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username: this.state.username, password: this.state.password})
    })
    .then(async response => {
      const isJson = response.headers.get('content-type')?.includes('application/json');
      const data = isJson ? await response.json() : null;

      // check for error response
      if (!response.ok) {
          // get error message from body or default to response status
          const error = (data && data.message) || response.status;
          console.log(error);
          return Promise.reject(response.status);
      }
    })
    .then(() => {
      var return_home = document.querySelector(".home_return_marker")
      console.log(return_home);
      simulateMouseClick(return_home);
      window.location.reload(false);
    })
    .catch((err) => {
      console.log('error'); 
      console.log(err);
      switch (err) {
        case 404:
          alert('Nie znaleziono użytkownika');
          break;
        case 401:
          alert('Niepoprawne hasło');
          break;
        default:
          alert('Wystąpił błąd, spróbuj ponownie później');
          break;
      }
    });
    event.preventDefault();
  }

  render() {
    return (
      <div className="login_box">
          <form onSubmit={this.handleSubmit}>
              <div>
                  <label>Login</label>
                  <input type="text" value={this.state.username} onChange={this.handleUsernameChange} className="text_input"/>
                  <div></div>
              </div>
              <div></div>
              <div>
                  <label>Hasło</label>
                  <input type="password" value={this.state.password} onChange={this.handlePasswordChange} className="text_input"/>
                  <div></div>
              </div>
              <div></div>
              <div>
                  <button type="submit">Log in</button>
              </div>
              <div>
                <div>
                Don't have account? 
                </div>
                <Link to={registerLink}> register now! </Link>
              </div>
          </form>
          <Link to='/' className="home_return_marker"></Link>
      </div>
    );
  }
}