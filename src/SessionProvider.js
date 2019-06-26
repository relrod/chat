import React from 'react';
import { Route } from 'react-router-dom';
import { goFetch, debouncer, throttling } from './utils.js';
import * as firebase from 'firebase';
import SessionContext from './SessionContext.js';
import { staticMessages, staticUsers, staticRooms } from './staticState.js'

const faker = require('faker');
const fs = require('fs');

function SessionProvider(props) {

  const handleConnection = uid => {
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

  const requestNotifPermission = (uid, messaging) => {
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

  const handleFcmToken = (fcmToken, uid, subscription) => {
    return fetch(`${process.env.REACT_APP_HTTP_URL}/addTokenToTopic`, {
      method: 'POST',
      body: JSON.stringify({ fcmToken, uid, subscription})
    })
    .then(function(response) {
      return response;
    })
    .catch(error => {
      console.log(error);
    });
  };

  const initNotifications = async user => {
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

  const setListeners = key => {
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

  const getFakeMessages = () => {
    let messages = {};
    const messagesRef = firebase.database().ref(`messages`);
    for (let i = 0; i < 10; i++) {
      const newMessageRef = messagesRef.push();
      const message = {
        "content" : faker.hacker.phrase(),
        "creator" : {
          "displayName" : faker.internet.userName(),
          "email" : faker.internet.email(),
          "photoURL" : faker.internet.avatar(),
          "uid" : faker.random.alphaNumeric()
        },
        key: newMessageRef.key,
        "read" : true,
        "roomId" : "-Ld7mZCDqAEcMSGxJt-x",
        "sentAt" : 1558661840808,
      }
      newMessageRef.set(message, error => {
        if (error) {
          console.log(error);
        } else {

        }
      });
      messages[newMessageRef.key] = message;
    }
    return messages;
  }

  // componentDidMount() {
  //   // firebase.auth().signOut();
  //   // debugger;
  //   // this.handleConnection();
  //   firebase.auth()
  //     .onAuthStateChanged(async user => {
  //       if (!user) {
  //         this.setState({ onAuthStateChangedError: true });
  //         firebase.auth().signOut();
  //       } else {
  //         const { userConfig } = await this.getUserConfig(user.uid);
  //         const lastVisited = userConfig.lastVisited;
  //         await setListeners(lastVisited);
  //         const fcmToken = await this.initNotifications(user);
  //         const activeRoom = await this.getActiveRoom(lastVisited);
  //         const { subscribedRooms } = await this.getRooms(userConfig.rooms);
  //         const { messages } = await this.getMessages(lastVisited, 100);
  //         this.setState({ userConfig, activeRoom, user, fcmToken, subscribedRooms, messages });
  //       }
  //     });
  //   firebase.auth()
  //     .getRedirectResult()
  //     .then(result => {
  //       if (result.credential) {
  //         const { credential } = result;
  //         const isNewUser = result.additionalUserInfo.isNewUser;
  //         this.setState({ credential, isNewUser });
  //       }
  //     })
  //     .catch(error => {
  //       this.setState({ error, onGetRedirectResultError: true });
  //     });
  //   if (firebase.auth().isSignInWithEmailLink(window.location.href)) {
  //     const stashedEmail = window.localStorage.getItem('emailForSignIn');
  //     firebase.auth()
  //       .signInWithEmailLink(stashedEmail, window.location.href)
  //       .then(result => {
  //         if (result.credential) {
  //           window.localStorage.removeItem('emailForSignIn');
  //           const { credential, user } = result;
  //           const isNewUser = result.additionalUserInfo.isNewUser;
  //           this.setState({ credential, isNewUser });
  //         }
  //       })
  //       .catch(error => {
  //         this.setState({ error, onSignInWithEmailLinkError: true });
  //       });
  //   }
  // };

  const getRooms = async rooms => {
    const url = `${process.env.REACT_APP_HTTP_URL}/getRooms`;
    const roomIds = rooms ? rooms : [];
    const subscribedRooms = await goFetch(url, {
      method: 'POST',
      body: JSON.stringify({ roomIds })
    });
    return subscribedRooms ? subscribedRooms : {};
  };

  const getMessages = (roomId, messageCount) => {
    return fetch(`${process.env.REACT_APP_HTTP_URL}/getMessages`, {
      method: 'POST',
      body: JSON.stringify({ roomId, messageCount })
    })
    .then(res => {
      return res.json();
    }).catch(error => {
      console.log(error);
    });
  };

  const getUserConfig = async uid => {
    const url = `${process.env.REACT_APP_HTTP_URL}/getUserConfig`;
    const userConfig = await goFetch(url, {
      method: 'POST',
      body: JSON.stringify({ uid })
    });
    return userConfig;
  };

  const getActiveRoom = async roomId => {
    const payload = [roomId];
    const url = `${process.env.REACT_APP_HTTP_URL}/getRooms`;
    const response = await goFetch(url, {
      method: 'POST',
      body: JSON.stringify({ roomIds: payload })
    });
    return response.subscribedRooms[0];
  };

  const updateActiveRoom = async roomId => {
    const { uid, lastVisited } = this.state.user;
    const ref = firebase.database().ref(`users/${uid}/lastVisited`);
    ref.set(roomId);
    ref.off();
  }

  const submitMessage = content => {
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

  const deleteMessage = msg => {
    const ref = firebase.database().ref(`messages`);
    ref.child(msg.key).remove();
  };

  const onlineUsersRef = firebase.database().ref(`users`);
  const messagesRef = firebase.database().ref(`messages`);
  const state = {
    firebase: firebase,
    activeRoom: {},
    fcmToken: '',
    user: {},
    userConfig: {},
    messages: {},
    subscribedRooms: [],
    users: []
  };
  return (
    <SessionContext.Provider value={{
      state,
      updateActiveRoom: roomId => {
        updateActiveRoom(roomId);
      },
      submitMessage: content => {
        submitMessage(content);
      },
      deleteMessage: key => {
        deleteMessage(key);
      }
    }}>
      {props.children}
    </SessionContext.Provider>
  );
}

export default SessionProvider;
