import React from 'react';
import ReactDOM from 'react-dom/client';
import ModeMenu from './modeMenu';
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';
import NavigationBar from "./universalComponents";
import LocalMultiplayer from "./localMultiplayer";
import OnlineMultiplayer from './onlineMP/onlineMultiplayer';
import LogIn from "./logIn";
import Register from "./register";
import Account from './account';
import SocketBoard from './onlineMP/socketBoard';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render((
      <Router>
        <NavigationBar />

        <Routes>
          <Route path="/localMultiplayer" element={
            <LocalMultiplayer />
          } />
          <Route path="/netGame">
            <Route path="" element={<OnlineMultiplayer />} />
            <Route path="game" element={<SocketBoard />} />
          </Route>
          <Route path="/logIn" element={
            <LogIn />
          } />
          <Route path="/register" element={
            <Register />
          } />
          <Route path="/account" element={
            <Account />
          } />
          <Route path="/" element={
            <ModeMenu />
          } />
        </Routes>
      </Router>
    )
);

