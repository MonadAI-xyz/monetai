import AuthRoute from '@routes/auth.route';
import IndexRoute from '@routes/index.route';
import AdminIndexRoute from '@routes/admin/index.route';
import validateEnv from '@utils/validateEnv';
import 'dotenv/config';
import App from './app';
import LLMRoute from '@routes/llm.route';
import TradingRoute from '@routes/trading.route';

validateEnv();

const app = new App([new IndexRoute(), new AuthRoute(), new LLMRoute(), new TradingRoute()], [new AdminIndexRoute()]);

app.listen();
export default app;
