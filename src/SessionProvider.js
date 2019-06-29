import React from 'react';
import { Route } from 'react-router-dom';
import { goFetch, debouncer, throttling } from './utils.js';
import * as firebase from 'firebase';
import { withRouter } from 'react-router-dom';
import RealTimeApi from './RealTimeApi.js';
import SessionContext from './SessionContext.js';
import { staticMessages, staticUsers, staticRooms } from './staticState.js'

class SessionProvider extends React.Component {

  handleConnection = uid => {
    const userStatusDatabaseRef = firebase.database().ref(`users/${uid}/activity`);
    const isOfflineForDatabase = {
      isOnline: false,
      lastChanged: firebase.database.ServerValue.TIMESTAMP,
    };
    const isOnlineForDatabase = {
      isOnline: true,
      lastChanged: firebase.database.ServerValue.TIMESTAMP,
    };
    firebase.database().ref('.info/connected').on('value', function(snapshot) {
      if (snapshot.val() === false) {
        return;
      };
      userStatusDatabaseRef.onDisconnect().set(isOfflineForDatabase).then(function() {
        userStatusDatabaseRef.update(isOnlineForDatabase);
      });
    });
  };

  requestNotifPermission = (uid, messaging) => {
    return messaging.requestPermission()
    .then(() => {
      const fcmToken = messaging.getToken();
      return fcmToken;
    })
    .then(token => {
      console.log(token);
      return this.handleFcmToken(token, uid, true)
      .then(fcmToken => {
        return token;
      });
    })
    .catch(error => {
      console.log('error occured from requestNotifPermission()', error);
      return error;
    });
  };

  handleFcmToken = (fcmToken, uid, subscription) => {
    return fetch(`${process.env.REACT_APP_HTTP_URL}/addTokenToTopic`, {
      method: 'POST',
      body: JSON.stringify({ fcmToken, uid, subscription})
    })
    .then(response => {
      return response;
    })
    .catch(error => {
      console.log(error);
    });
  };

  initNotifications = async user => {
    if (firebase.messaging.isSupported()) {
      const messaging = firebase.messaging();
      const currentFcmToken = await messaging.getToken();
      this.handleFcmToken(currentFcmToken, user.uid, true);
      messaging.onTokenRefresh(async () => {
        console.log('refreshed token');
        const fcmToken = await this.requestNotifPermission(user.uid, messaging);
        return fcmToken;
      });
    } else {
      return false;
    }
  };

  setListeners(key) {
    this.onlineUsersRef
      .orderByChild('lastVisited')
      .equalTo(key)
      .limitToLast(1)
      .on('child_added', snap => {
        const oldUsers = this.state.users;
        this.setState({ users: oldUsers.concat(snap.val()) });
    });
    this.messagesRef
      .orderByChild('roomId')
      .equalTo(key)
      .limitToLast(1)
      .on('child_added', snapshot => {
        if (snapshot.val().roomId === key) {
          const messages = this.state.messages;
          const newMessages = Object.assign({}, messages, { [snapshot.key]: snapshot.val() });
          this.setState({ messages: newMessages });
        }
    });
    this.messagesRef
    .orderByChild('roomId')
    .equalTo(key)
    .limitToLast(1)
      .on('child_removed', snapshot  => {
        if (snapshot.val().roomId === key) {
          const deletedKey = snapshot.key;
          const { [deletedKey]: something, ...rest } = this.state.messages;
          const newMessages = Object.assign({}, rest);
          this.setState({ messages: newMessages });
        }
    });
  };

  updateActiveRoom = async roomId => {
    const { uid, lastVisited } = this.state.user;
    let error = null;
    const {messages} = await new RealTimeApi().getMessages(roomId, 100);
    const ref = await firebase.database().ref(`users/${uid}/lastVisited`);
    await ref.set(roomId, dbError => error = dbError );
    await this.setState({ messages, lastVisited: roomId, error }, () => {
      ref.off();
    });
  };

  submitMessage = content => {
    const { displayName, email, photoURL, uid } = this.state.user;
    const messagesRef = firebase.database().ref(`messages`);
    const newMessageRef = messagesRef.push();
    let messages = this.state.messages;
    const message = {
      content,
      "creator": { displayName, email, photoURL, uid },
      "key": newMessageRef.key,
      "read" : false,
      "roomId" : this.state.activeRoom.key,
      "sentAt" : Date.now()
    }
    newMessageRef.set(message, error => {
      if (error) {
        this.setState({ error });
      }
    });
  };

  deleteMessage = msg => {
    const ref = firebase.database().ref(`messages`);
    ref.child(msg.key).remove();
  };

  handleRoomDeclaration = async (roomId, uid) => {
    // const user = await firebase.auth().currentUser;
    // if (user) {
    //   this.initializeApp(uid, user);
    // } else {
    //   this.props.history.push(`/auth/registration`);
    // }
    // const {messages} = await new RealTimeApi().getMessages(roomId, 100);
    // const {rooms} = await new RealTimeApi().getRooms(roomId);
    // await this.setState(messages, rooms);
    // const activeRoom = this.updateActiveRoom(roomId);
    console.log('hi');
  }

  onlineUsersRef = firebase.database().ref(`users`);
  messagesRef = firebase.database().ref(`messages`);
  state = {
    firebase: firebase,
    activeRoom: {},
    fcmToken: '',
    user: {},
    userConfig: {},
    messages: {},
    subscribedRooms: [],
    users: []
  };

  initializeApp = async uid => {
    // this.handleConnection();
    const { userConfig } = await new RealTimeApi().getUserConfig(uid);
    const lastVisited = userConfig.lastVisited;
    await this.setListeners(lastVisited);
    const fcmToken = await this.initNotifications(uid);
    const activeRoom = await new RealTimeApi().getActiveRoom(lastVisited);
    const { subscribedRooms } = await new RealTimeApi().getRooms(userConfig.rooms);
    const { messages } = await new RealTimeApi().getMessages(lastVisited, 100);
    this.setState({ userConfig, activeRoom, fcmToken, subscribedRooms, messages, uid });
  };

  // componentDidMount() {
  //   // this.initializeApp();
  //   this.props.history.listen((location, action) => {
  //     console.log(this.props.history.location);
  //   });
  // };

  render() {
    return (
      <SessionContext.Provider value={{
        state: this.state,
        updateActiveRoom: roomId => {
          this.updateActiveRoom(roomId);
        },
        submitMessage: content => {
          this.submitMessage(content);
        },
        deleteMessage: key => {
          this.deleteMessage(key);
        },
        initializeApp: (uid, user) => {
          this.initializeApp(uid, user);
        },
        handleRoomDeclaration: (roomId, uid) => {
          this.handleRoomDeclaration(roomId, uid);
        },
      }}>
        {this.props.children}
      </SessionContext.Provider>
    );
  };
}

export default withRouter(SessionProvider);
