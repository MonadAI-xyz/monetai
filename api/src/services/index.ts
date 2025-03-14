import BaseService from './baseService.service'; // Import all services
import AuthService from './auth.service';
import UserService from './user.service';
import LlmService from './llm.service';
import MarketDataService from './marketData.service';
import TradingService from './trading.service';
import LlmQueue from './queues/llmDecision.worker';
import CurvanceService from './curvance.service';
import XService from '@services/x.service';

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
  LlmService,
  MarketDataService,
  TradingService,
  CurvanceService,
  // Queues
  LlmQueue,
  XService,
};

class Services {
  private static instance: IServiceInstances = {} as IServiceInstances;

  public static initialize(): void {
    Object.entries(allServices).forEach(([key, ServiceClass]) => {
      const name = _.camelCase(key) as keyof IServiceInstances;
      if (!this.instance[name]) {
        this.instance[name] = new (ServiceClass as any)();
      }
    });

    this.injectDependencies();
  }

  public static getInstance(): IServiceInstances {
    if (Object.keys(this.instance).length === 0) {
      this.initialize();
    }
    return this.instance;
  }

  private static injectDependencies(): void {
    Object.entries(this.instance).forEach(([serviceName, serviceInstance]) => {
      if (serviceInstance instanceof BaseService) {
        const dependencies: Record<string, any> = {};
        Object.keys(this.instance).forEach(propName => {
          if (propName !== serviceName) {
            dependencies[propName] = this.instance[propName as keyof IServiceInstances];
          }
        });
        serviceInstance.setDependencies(dependencies);
      }
    });
  }
}

Services.initialize();

export default Services;
