import login from './login';

export default {
  paths: {
    '/api/auth/login': {
      ...login,
    },
  },
};
