import BaseService from './baseService.service'; // Import all services
import AuthService from './auth.service';
import UserService from './user.service';
import LLMService from './llm.service';

import _ from 'lodash';

type Constructor<T = any> = new (...args: any[]) => T;

type CamelCase<T extends string> = T extends `${infer First}${infer Rest}` ? `${Lowercase<First>}${Rest}` : T;

type ServiceInstances<T extends Record<string, Constructor>> = {
  [K in keyof T as CamelCase<string & K>]: InstanceType<T[K]>;
};

// Define the dynamic interface for all services
export type IServiceInstances = ServiceInstances<typeof allServices>;
// Store all services in an object
export const allServices = {
  AuthService,
  UserService,
  LLMService,
};

class Services {
  private static instance: IServiceInstances = {} as IServiceInstances;

  public static getInstance(): IServiceInstances {
    if (Object.keys(this.instance).length === 0) {
      this.initialize();
    }
    return this.instance;
  }

  private static initialize(): void {
    Object.entries(allServices).forEach(([key, ServiceClass]) => {
      const name = _.camelCase(key) as keyof IServiceInstances;
      if (!this.instance[name]) {
        this.instance[name] = new (ServiceClass as any)();
      }
    });

    Object.entries(this.instance).forEach(([serviceName, serviceInstance]) => {
      if (serviceInstance instanceof BaseService) {
        const dependencies = Object.fromEntries(
          Object.entries(this.instance).filter(([key]) => key !== serviceName)
        );
        serviceInstance.setDependencies(dependencies);
      }
    });
  }
}

export default Services;
