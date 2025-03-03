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
  private static instance: Services;
  public authService: AuthService;
  public llmService: LLMService;
  private static serviceInstances: IServiceInstances = {} as IServiceInstances;

  private constructor() {
    this.authService = new AuthService();
    this.llmService = new LLMService();
    this.initialize();
  }

  public static getInstance(): Services {
    if (!Services.instance) {
      Services.instance = new Services();
    }
    return Services.instance;
  }

  private initialize(): void {
    Object.entries(allServices).forEach(([key, ServiceClass]) => {
      const name = _.camelCase(key) as keyof IServiceInstances;
      if (!Services.serviceInstances[name]) {
        Services.serviceInstances[name] = new (ServiceClass as any)();
      }
    });

    this.injectDependencies();
  }

  private injectDependencies(): void {
    Object.entries(Services.serviceInstances).forEach(([serviceName, serviceInstance]) => {
      if (serviceInstance instanceof BaseService) {
        const dependencies: Record<string, any> = {};
        Object.keys(Services.serviceInstances).forEach(propName => {
          if (propName !== serviceName) {
            dependencies[propName] = Services.serviceInstances[propName as keyof IServiceInstances];
          }
        });
        serviceInstance.setDependencies(dependencies);
      }
    });
  }
}

export default Services;
