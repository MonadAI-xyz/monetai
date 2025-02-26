import qs from 'qs';
import merge from 'lodash.merge';
import config from '@config';

class BuilderAbstract {
  public Sequelize: any;
  public request: { [p: string]: unknown };
  protected config: any;

  /**
   * @param {Object} Sequelize
   * @param {(Object|string)} request
   */
  constructor(Sequelize, request = {}) {
    if (new.target === BuilderAbstract) {
      throw new TypeError('Cannot construct BuilderAbstract instances directly');
    }
    this.Sequelize = Sequelize;
    this.request = BuilderAbstract.prepareRequest(request);
    this.setConfig(config.app.sequelize.searchBuilder);
  }

  /**
   * Transform request to request object
   * @param {(Object|string)} request
   *
   * @returns {Object}
   */
  static prepareRequest(request = {}) {
    if (typeof request === 'string') {
      return qs.parse(request, { ignoreQueryPrefix: true });
    }

    return request || {};
  }

  /**
   * Set Builder configs
   *
   * @param {Object} value - config options
   *
   * @returns {this}
   */
  setConfig(value) {
    if (value !== null && typeof value === 'object') {
      this.config = merge(this.config, value);
    } else {
      console.error('Config parameter should be an object');
    }

    return this;
  }
}

export default BuilderAbstract;
