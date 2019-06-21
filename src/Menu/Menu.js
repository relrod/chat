import React from 'react';
import Rooms from '../Rooms/Rooms';
import Users from '../Users/Users';
import SessionContext from '../SessionContext.js';
import './Menu.css';

class Menu extends React.Component {
  static contextType = SessionContext;
  render() {
    const { user } = this.context.state;
    return (
      <section className="menuComponent">
        <div className="userAvatarContainer">
          <img
            className="userAvatar"
            alt="user"
            src={user ? user.photoURL : ''}
           />
          <p className="menuDisplayName">{ user.displayName }</p>
        </div>
        <div className="menuRoomListContainer">
          <h1>rooms</h1>
          <Rooms />
        </div>
        <h1>users</h1>
        <Users />
      </section>
    );
  }
}

export default Menu;
