import React, { useContext, useEffect, Fragment } from 'react';
import { Route, Switch } from 'react-router-dom';
import {RegistrationForm} from './RegistrationForm.js';
import SignInWithEmailForm from './SignInWithEmailForm.js';
import VerificationForm from './VerificationForm.js';
import Modal from '../Modal/Modal.js';
import useOAuth from './useOAuth.js';
import useSignInMethods from '../hooks/useSignInMethods.js';
import useRedirect from '../hooks/useRedirect.js';
import useUser from '../hooks/useUser.js';
import { withRouter, Redirect } from 'react-router-dom';
import './Auth.css';

const Auth = props => {
	// const [state, setSelection] = useOAuth();
	// const uid = useUser();
  // console.log(uid);
	const [accessToken, userInfo, redirectError] = useRedirect();
	console.log(accessToken);
	// const [email, methods, signInMethodError] = useSignInMethods();
	// useEffect(() => {
  //   console.log(accessToken, userInfo, redirectError);
  // }, [accessToken, userInfo, redirectError]);
	return (
		<Fragment>
			<Route path='/auth/registration' component={RegistrationForm} />
			<Route path='/auth/signin' component={SignInWithEmailForm} />
			<Route path='/auth/verification' component={VerificationForm} />
		</Fragment>
	);
};

export default withRouter(Auth);

// https://github.com/ReactTraining/react-router/blob/master/packages/react-router/docs/api/withRouter.md#important-note
