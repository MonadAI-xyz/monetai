import BuilderAbstract from './builderAbstract';
import OrderBuilder from './orderBuilder';
import WhereBuilder from './whereBuilder';

const constructors = {
  filter: WhereBuilder,
  order: OrderBuilder,
};

class SearchBuilder extends BuilderAbstract {
  /**
   * Get object with sequelize where conditions
   * @returns {(Object|null)} sequelize where query
   */
  getWhereQuery() {
    return this.getQueryByType('filter');
  }

  /**
   * Get object with sequelize order conditions
   * @returns {(Object|null)} sequelize order query
   */
  getOrderQuery() {
    return this.getQueryByType('order');
  }

  /**
   * Get object with sequelize conditions by type
   * @param {string} type
   * @returns {(Object|null)} sequelize query
   */
  getQueryByType(type) {
    const request = this.request[this.config.fields[type]];
    return SearchBuilder.prepareResponse(new constructors[type](this.Sequelize, request).setConfig(this.config).getQuery());
  }

  /**
   * Get string with limit value
   * @returns {(int|null)} limit value
   */
  getLimitQuery() {
    return SearchBuilder.prepareIntegerQuery(this.request[this.config.fields.limit]) || this.config['defaultLimit'] || null;
  }

  /**
   * Get string with offset value
   * @returns {(int|null)} offset value
   */
  getOffsetQuery() {
    return SearchBuilder.prepareIntegerQuery(this.request[this.config.fields.offset]) || null;
  }

  /**
   * Get object with all sequelize conditions (where, order, limit, offset)
   * @param {Object} target object for extending
   * @returns {Object} sequelize queries with all conditions
   */
  getFullQuery(target = {}) {
    return Object.assign({}, target, {
      where: this.getWhereQuery() || {},
      limit: this.getLimitQuery() || 50,
      offset: this.getOffsetQuery() || 0,
    });
  }

  /**
   * Prepare sequelize query for response
   * @returns {(Object|null)} sequelize query
   * @param query
   */
  static prepareResponse(query) {
    return Object.keys(query).length === 0 && Object.getOwnPropertySymbols(query).length === 0 ? null : query;
  }

  /**
   * Prepare integer response (limit and offset values)
   * @returns {(int|null)} integer value
   * @param query
   */
  static prepareIntegerQuery(query) {
    const intQuery = parseInt(query, 10);
    return Number.isInteger(intQuery) && intQuery >= 0 ? intQuery : null;
  }
}

export default SearchBuilder;
