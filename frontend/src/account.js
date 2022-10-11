import React, { Component } from "react";
import { Link } from "react-router-dom";
import './account.css';

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

export default class Account extends Component {
  constructor(props) {
    super(props);
    this.state = { username: '', elo: -1 };

    this.logout = this.logout.bind(this);
  }

  componentDidMount() {
    fetch("/api/auth/status", {
        credentials: "same-origin"
    })
        .then(async res => {
            let body = await res.json();
            console.log(body);
            fetch("/api/user/" + body.nick, {
              credentials: "same-origin"
            })
              .then(async res => {
                let body = await res.json();
                console.log(body);
                this.setState({ username: body.nick, elo: body.elo });
              })
              .catch(err => {
                alert('Wystąpił błąd przy pobieraniu danych, spróbuj ponownie później');
              })
        })
        .catch(err => {
          alert('Wystąpił błąd przy pobieraniu danych, spróbuj ponownie później');
        })
  }

  logout() {
    fetch('/api/auth/signout', {
      method: 'post',
      credentials: "same-origin",
      headers: {'Content-Type': 'application/json'},
    })
    .then(async response => {
      if (!response.ok) {
        const isJson = response.headers.get('content-type')?.includes('application/json');
        const data = isJson ? await response.json() : null;

        // check for error response
        if (!response.ok) {
            // get error message from body or default to response status
            const error = (data && data.message) || response.status;
            console.log(error);
            return Promise.reject(response.status);
        }
      }
    })
    .then(() => {
      var return_home = document.querySelector(".home_return_marker")
      console.log(return_home);
      simulateMouseClick(return_home);
    })
    .catch((err) => {
      var return_home = document.querySelector(".home_return_marker")
      console.log(return_home);
      simulateMouseClick(return_home);
      console.log('error'); 
      console.log(err);
      switch (err) {
        default:
          alert('Wystąpił błąd przy wylogowaniu, spróbuj ponownie później');
          break;
      }
    });
  }

  render() {
    return (
      <>
        <div className="account_box">
          <h1>{this.state.username}</h1>
          <h2>Elo: {this.state.elo}</h2>
          <button className="logout_button" onClick={this.logout}>Logout</button>
        </div>
        <Link to='/' className="home_return_marker"></Link>
      </>
    );
  }
}