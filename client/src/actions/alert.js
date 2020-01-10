import uuid from 'uuid';
import { REMOVE_ALERT, SET_ALERT } from './types';

export const setAlert = (msg, alertType, timeOut = 3000) => dispatch => {
  const id = uuid.v4();
  const setAlertData = {
    msg,
    alertType,
    id
  };

  const removeAlertData = {
    id
  };

  dispatch({
    type: SET_ALERT,
    payload: setAlertData
  });

  setTimeout(
    () => dispatch({ type: REMOVE_ALERT, payload: removeAlertData }),
    timeOut
  );
};
