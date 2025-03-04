import config from '@config';
import Routes from '@interfaces/routes.interface';
import { errorHandler } from '@middlewares/errorHandler.middleware';
import namespaceMiddleware from '@middlewares/namespace.middleware';
import requestLoggerMiddleware from '@middlewares/requestLogger.middleware';
import successMiddleware from '@middlewares/success.middleware';
import { logger, stream } from '@utils/logger';
import bodyParser from 'body-parser';
import cors from 'cors';
import express from 'express';
import expressWs from 'express-ws';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import path from 'path';
import responseTime from 'response-time';
import swaggerUi from 'swagger-ui-express';
import swagger from './swagger';

class App {
  public app: express.Application;
  public expressWs: any;
  public port: number;
  public env: string;

  constructor(routes: Routes[], adminRoutes?: Routes[]) {
    this.expressWs = expressWs(express(), null, {
      wsOptions: {
        verifyClient: (info: any, cb: any) => {
          try {
            const token = new URLSearchParams(info.req.url.split('?')[1]).get('token');
            if (!token) {
              throw new Error('Unauthorized');
            }
            info.req.user = jwt.verify(token, config.auth.secret);
            return cb(true);
          } catch (e) {
            console.error('[WS] Error trying to connect', e);
            return cb(false, 401, 'Unauthorized');
          }
        },
      },
    });
    this.app = this.expressWs.app;
    this.port = config.app.port;
    this.env = config.app.env;

    this.initializeMiddlewares();
    this.initializeRoutes(routes, adminRoutes);
    this.initializeSwagger();
    this.initializeErrorHandling();
    this.initializeStaticRoutes();

    this.app.set('view engine', 'ejs');
    this.app.set('view engine', 'ejs');
  }

  public listen() {
    this.app.listen(this.port, () => {
      logger.info({ message: `App listening on the port: ${this.port}`, labels: { origin: 'app' } });
    });
  }

  public getServer() {
    return this.app;
  }

  public getWs() {
    return this.expressWs;
  }

  private initializeMiddlewares() {
    this.app.use(responseTime(requestLoggerMiddleware));

    if (this.env === 'production') {
      this.app.use(morgan('combined', { stream }));
      this.app.use(cors());
    } else if (this.env === 'development') {
      this.app.use(morgan('dev', { stream }));
      this.app.use(cors({ origin: true, credentials: true }));
    }
    this.app.use(cors());
    this.app.use(
      helmet({
        contentSecurityPolicy: false,
      }),
    );

    this.app.use(bodyParser.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    const whitelist = process.env.WHITE_LIST;
    const corsOptions = {
      origin: function (origin, callback) {
        if (whitelist?.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback();
        }
      },
      // credentials: true,
      maxAge: 86400,
    };
    this.app.use(cors(corsOptions));
  }

  private initializeStaticRoutes() {
    this.app.use('/public', express.static(path.join(__dirname, 'public')));
  }

  private initializeRoutes(routes: Routes[], adminRoutes?: Routes[]) {
    this.app.ws('/ws/users/:userId', function (ws, req) {
      ws.on('message', function (msg) {
        console.log('Message received:', msg);
      });
      if (req.params.userId !== req.user.id) {
        ws.close();
      } else {
        ws.userId = req.params.userId;
      }
    });
    routes.forEach(route => {
      this.app.use('/apis', route.router);
    });
    if (adminRoutes?.length > 0) {
      adminRoutes.forEach(route => {
        this.app.use('/apis/admin/', namespaceMiddleware('ACCOUNTANT'), route.router);
      });
    }
  }

  private initializeSwagger() {
    this.app.use('/apis-docs', swaggerUi.serve, swaggerUi.setup(swagger));
  }

  private initializeErrorHandling() {
    this.app.use(successMiddleware);
    this.app.use(errorHandler);
  }
}

export default App;
