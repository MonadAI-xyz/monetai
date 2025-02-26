import config from '@config';

export default {
  isComparableField: key => key[0] !== '_',

  getFieldKey: key => {
    let result = key;
    if (key.indexOf('.') !== -1) {
      result = `$${key}$`;
    }

    return result;
  },

  getEqualOp: (key, value) => {
    return {
      [key]: value,
    };
  },

  log: (mode, message) => {
    if (config.app.sequelize.searchBuilder.logging) {
      console[mode](message);
    }
  },
};
