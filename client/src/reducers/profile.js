import { GET_PROFILE, PROFILE_ERROR } from '../actions/types';

const initialState = {
  profile: null,
  profiles: [],
  repos: [],
  loading: true,
  error: {}
};

export const profileReducer = (state = initialState, action) => {
  const { type, payload } = action;

  switch (type) {
    case GET_PROFILE:
      return { ...state, loading: false, profile: payload };
    case PROFILE_ERROR:
      return { ...state, loading: false, error: payload };
    default:
      return state;
  }
};
