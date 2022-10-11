import React, { Component } from "react";
import "./logIn.css";
import { Link } from "react-router-dom";

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

export default class Register extends Component {
  constructor(props) {
    super(props);
    this.state = {username: '', password0: '', password1: ''};

    this.handleUsernameChange = this.handleUsernameChange.bind(this);
    this.handlePassword0Change = this.handlePassword0Change.bind(this);
    this.handlePassword1Change = this.handlePassword1Change.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUsernameChange(event) {
    this.setState({username: event.target.value, password0: this.state.password0, password1: this.state.password1});
  }

  handlePassword0Change(event) {
    this.setState({username: this.state.username, password0: event.target.value, password1: this.state.password1});
  }

  handlePassword1Change(event) {
    this.setState({username: this.state.username, password0: this.state.password0, password1: event.target.value});
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
    if (this.state.password0.length <= 0) {
        alert('hasło jest za krótkie!');
        return;
    }
    if (this.state.password0.length > 1000) {
        alert('hasło jest za długie!');
        return;
    }
    if (this.state.password0 !== this.state.password1) {
        alert("Hasła muszą być takie same!");
        return;
    }
    fetch('/api/auth/signup', {
        method: 'post',
        credentials: "same-origin",
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({username: this.state.username, password: this.state.password0})
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
      })
      .catch((err) => {
        console.log('error'); 
        console.log(err);
        switch (err) {
            case 400:
                alert('Użytkownik już istnieje!');
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
                  <input type="password" value={this.state.password0} onChange={this.handlePassword0Change} className="text_input"/>
                  <div></div>
              </div>
              <div></div>
              <div>
                  <label>Powtórz hasło</label>
                  <input type="password" value={this.state.password1} onChange={this.handlePassword1Change} className="text_input"/>
                  <div></div>
              </div>
              <div></div>
              <div>
                  <button type="submit">Register</button>
              </div>
          </form>
          <Link to='/' className="home_return_marker"></Link>
      </div>
    );
  }
}