import axios from 'axios';
import {
  AUTH_ERROR,
  LOGIN_FAIL,
  LOGIN_SUCCESS,
  REGISTER_FAIL,
  REGISTER_SUCCESS,
  USER_LOADED
} from './types';
import { setAlert } from './alert';
import { config, setAuthToken } from '../utils/setAuthToken';

// Load user
export const loadUser = () => async dispatch => {
  if (localStorage.token) {
    setAuthToken(localStorage.token);
  }

  try {
    const res = await axios.get('/api/auth');
    dispatch({
      type: USER_LOADED,
      payload: res.data
    });
  } catch (e) {
    dispatch({
      type: AUTH_ERROR
    });
  }
};

// Register user
export const register = ({ name, email, password }) => async dispatch => {
  const body = JSON.stringify({ name, email, password });

  try {
    const res = await axios.post('/api/users', body, config);

    dispatch({
      type: REGISTER_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
  } catch (e) {
    const errors = e.response.data.errors;
    if (errors.length > 0) {
      errors.forEach(error =>
        dispatch(setAlert(error.message, 'danger', 2000))
      );
    }

    dispatch({
      type: REGISTER_FAIL
    });
  }
};

// Login user
export const login = userCredentials => async dispatch => {
  const body = JSON.stringify(userCredentials);

  try {
    const res = await axios.post('/api/auth', body, config);

    dispatch({
      type: LOGIN_SUCCESS,
      payload: res.data
    });

    dispatch(loadUser());
  } catch (e) {
    const errors = e.response.data.errors;
    if (errors.length > 0) {
      errors.forEach(error =>
        dispatch(setAlert(error.message, 'danger', 3000))
      );
    }

    dispatch({
      type: LOGIN_FAIL
    });
  }
};
