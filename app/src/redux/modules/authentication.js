import _ from 'lodash';
import { APP_NAMESPACE } from '../../util/redux-constants';
import { post } from '../../util/http-utils';
import { deleteCookie, getCookie, setCookie } from '../../util/cookie-utils';
import { updateStore, buildGenericInitialState, handleError } from '../../util/store-utils';
import { getAppUrl } from '../../util/environment-utils';

const typeBase = `${APP_NAMESPACE}/authentication/`;

// Constants
export const CHANGE_AUTH = `${typeBase}CHANGE_AUTH`;
export const SET_POST_AUTH_PATH = `${typeBase}SET_POST_AUTH_PATH`;
export const RESET_PASSWORD = `${typeBase}RESET_PASSWORD`;

const AUTH_ENDPOINT_BASE = '/auth';

// Actions
export const changeAuthentication = payload => dispatch =>
  dispatch({
    type: CHANGE_AUTH,
    payload,
  });

/**
 * login - Authenticate a user with an email and password
 * @param {Object} credentials  Login credentials (email, password)
 */
export const login = (credentials, desiredPath) => async (dispatch) => {
  try {
    const response = await post(dispatch, CHANGE_AUTH, `${AUTH_ENDPOINT_BASE}/login`, credentials, false);

    // If the login was successful, set the JWT as a cookie
    if (response) {
      setCookie('token', response.token, { maxAge: response.tokenExpiration });

      if (desiredPath) {
        window.location.href = `${getAppUrl()}${desiredPath}`;
      } else {
        window.location.href = `${getAppUrl()}/dashboard`;
      }
    }
  } catch (err) {
    console.log(err)
    await handleError(dispatch, err, CHANGE_AUTH);
  }
};

/**
 * register - Creates a new account for a user
 * @param {Object} formData  User's form data
 */
export const register = formData => async (dispatch) => {
  try {
    const response = await post(dispatch, CHANGE_AUTH, `${AUTH_ENDPOINT_BASE}/register`, formData, false);

    // If the registration was successful, set the JWT as a cookie
    if (response) {
      setCookie('token', response.token, { maxAge: response.tokenExpiration });
      window.location.href = `${getAppUrl()}/dashboard`;
    }
  } catch (err) {
    await handleError(dispatch, err, CHANGE_AUTH);
  }
};

/**
 * setPostAuthPath  - Save Desired Pre-Auth Path to State
 * @param {String} payload  The desired path, saved pre-authentication
 * @returns {function}
 */
export const setPostAuthPath = payload => dispatch =>
  dispatch({
    type: SET_POST_AUTH_PATH,
    payload,
  });

/**
 * logoutUser  - Log user out by clearing auth state and token cookie
 */
export const logoutUser = () => (dispatch) => {
  dispatch({ type: CHANGE_AUTH, payload: {} });
  deleteCookie('token');

  window.location.href = `${getAppUrl()}/login`;
};

/**
 * forgotPassword - Sends user an email with a token to reset their password
 * @param {Object} formData  The user's email address
 * @returns {Promise}
 */
export const forgotPassword = formData => async (dispatch) => {
  try {
    const response = await post(dispatch, CHANGE_AUTH, `${AUTH_ENDPOINT_BASE}/forgot-password`, formData, false);
    return Promise.resolve(response);
  } catch (err) {
    await handleError(dispatch, err, CHANGE_AUTH);
  }
};

/**
 * resetPassword - Resets a user's password, given a valid token
 * @param {Object} formData  The user's email address
 * @param {String} token     Valid token required for password reset
 * @returns {Promise}
 */
export const resetPassword = (formData, token) => async (dispatch) => {
  try {
    const response = await post(dispatch, CHANGE_AUTH, `${AUTH_ENDPOINT_BASE}/reset-password/${token}`, formData, false);
    return Promise.resolve(response);
  } catch (err) {
    await handleError(dispatch, err, CHANGE_AUTH);
  }
};

// Store
const INITIAL_STATE = {
  authenticated: Boolean(getCookie('token')),
  user: '',
  ...buildGenericInitialState([CHANGE_AUTH, SET_POST_AUTH_PATH, RESET_PASSWORD]),
};

export default (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case CHANGE_AUTH:
      return updateStore(state, action, { authenticated: Boolean(_.get(action, 'payload.token')), user: _.get(action, 'payload.user.id') });
    default:
      return state;
  }
};
