import React, { useContext, useEffect, Fragment } from 'react';
import { Route, Switch } from 'react-router-dom';
import {RegistrationForm} from './RegistrationForm.js';
import SignInWithEmailForm from './SignInWithEmailForm.js';
import VerificationForm from './VerificationForm.js';
import Modal from '../Modal/Modal.js';
// import useSignInMethods from '../hooks/useSignInMethods.js';
import useRedirect from '../hooks/useRedirect.js';
// import useUser from '../hooks/useUser.js';
import { withRouter, Redirect } from 'react-router-dom';
import './Auth.css';

const Auth = props => {
	const {redirectLoading, ...rest} = useRedirect();
	// const {email, methods, signInMethodError, methodsLoading} = useSignInMethods();
	useEffect(() => {
		if (!redirectLoading) {
			console.log(rest);
		}
  }, [redirectLoading]);
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
