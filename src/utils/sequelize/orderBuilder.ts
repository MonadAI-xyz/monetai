import BuilderAbstract from './builderAbstract';

class OrderBuilder extends BuilderAbstract {
  getQuery() {
    const { request } = this;
    const query = [];

    Object.keys(request).forEach(key => {
      const value = key.split('.');
      value.push(<string>request[key]);
      query.push(value);
    });

    return query;
  }
}

export default OrderBuilder;
