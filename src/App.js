import React, { Component } from 'react';
import './App.css';
import * as firebase from 'firebase';

import Messages from './Messages/Messages';
import RoomList from './RoomList/RoomList';
import User from './User/User';
import SubmitMessage from './SubmitMessage/SubmitMessage';

const config = {
  apiKey: "AIzaSyAgvoGPD9Rh1p1Pf0TxHTdPGunB_KR9OqQ",
  authDomain: "chat-asdf.firebaseapp.com",
  databaseURL: "https://chat-asdf.firebaseio.com",
  projectId: "chat-asdf",
  storageBucket: "chat-asdf.appspot.com",
  messagingSenderId: "145747598382"
};
firebase.initializeApp(config);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activeRoom: null,
      user: null
    };
  }

  componentDidMount() {
    console.log(this.state.user);
  }

  setUser(user) {
    this.setState({ user });
  }

  setRoom(room) {
    this.setState({ activeRoom: room });
  }

  render() {
    return (
      <div>
        <header class="header">
          <User firebase={firebase} setUser={this.setUser.bind(this)} user={this.state.user} />
        </header>
        <aside id="sidebar">
          <RoomList firebase={firebase} activeRoom={this.state.activeRoom} setRoom={this.setRoom.bind(this)} user={this.state.user} />
          <div id="logo"></div>
          <h1 id="wordmark">Potato</h1>
        </aside>
        <main>
          <Messages firebase={firebase} activeRoom={this.state.activeRoom} user={this.state.user} />
        </main>
        <footer>
          <SubmitMessage
            activeRoom={this.state.activeRoom}
            user={this.state.user}
            firebase={firebase}
          />
        </footer>
      </div>
    );
  }
}

export default App;
