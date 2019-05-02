import React, { Component } from 'react';

import {reduxForm, Field} from 'redux-form';
import Input from '../Input/Input';
import {required, nonEmpty, matches, length, isTrimmed, email} from '../validators';

import './Auth.css';

const passwordLength = length({min: 10, max: 72});
const matchesPassword = matches('password');

class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      user: null,
      errorMessage: null,
    };
  }

  registerUser(values) {
    this.props.firebase.auth()
      .createUserWithEmailAndPassword(values.email, values.password)
      .then(res => {
        console.log('registration complete', res);
        this.signIn(values);
      })
      .catch(function(error) {
        console.log(error);
        const {code} = error;
        if (code === "auth/email-already-in-use") {
          alert('email already in use');
          // Convert ValidationErrors into SubmissionErrors for Redux Form
          // return Promise.reject(
          //   new SubmissionError({
          //       ['auth/email-already-in-use']: message
          //   })
          // );
        }
        // return Promise.reject(
        //     new SubmissionError({
        //         _error: 'Error submitting message'
        //     })
        // );
    }).bind(this);
  }

  signIn(email, password) {
    this.props.firebase.auth().signInWithEmailAndPassword(email, password)
      .then(res => {
        console.log('user signed In: ', res);
        // this.setState({
        //   user:
        // });
        this.props.toggleModal();
      })
      .catch(function(error) {
        console.log('error at sugn in: ', error);
      });
  }

  signInWithGoogle() {
    this.props.firebase.auth()
      .signInWithPopup( new this.props.firebase.auth.GoogleAuthProvider() )
      .then(res => {
        this.props.toggleModal();
      });
  }

  signOut() {
    this.props.firebase.auth().signOut().then(res => {
      this.props.toggleModal();
    });
  }

  render() {
    let successMessage;
    if (this.props.submitSucceeded) {
      successMessage = (
        <div className="message message-success">
            Message submitted successfully
        </div>
      );
    }

    let errorMessage;
    if (this.props.error) {
      errorMessage = (
        <div className="message message-error">{this.props.error}</div>
      );
    }
    return (
      <section className="authComponent">
        <form
            className="login-form"
            onSubmit={this.props.handleSubmit(values =>
                this.registerUser(values)
            )}>
            {successMessage}
            {errorMessage}
            <label htmlFor="username">Username</label>
            <Field
                component={Input}
                type="text"
                name="username"
                validate={[required, nonEmpty, isTrimmed]}
            />
            <label htmlFor="email">email</label>
            <Field
                component={Input}
                type="email"
                name="email"
                validate={[required, nonEmpty, isTrimmed, email]}
            />
            <label htmlFor="password">Password</label>
            <Field
                component={Input}
                type="password"
                name="password"
                validate={[required, passwordLength, isTrimmed]}
            />
            <label htmlFor="passwordConfirm">Confirm password</label>
            <Field
                component={Input}
                type="password"
                name="passwordConfirm"
                validate={[required, nonEmpty, matchesPassword]}
            />
            <button
                type="submit"
                disabled={this.props.pristine || this.props.submitting}>
                Register
            </button>
        </form>
        <div className="on-off-button"
             onClick={ this.state.user ?
               () => this.signOut() : this.signInWithGoogle.bind(this) }>
          <i className="material-icons">power_settings_new</i>
          <p>Sign { this.state.user ? 'out' : 'in' }</p>
        </div>
      </section>
    );
  }
}

// export default App;

export default reduxForm({
    form: 'contact',
    onSubmitFail: (errors, dispatch) =>
        console.log('email already taken', errors)
})(Auth);
