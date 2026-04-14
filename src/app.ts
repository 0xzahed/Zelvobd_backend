import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { globalErrorHandler } from './core/errors/globalErrorHandler';
import { notFoundHandler } from './core/errors/notFoundHandler';
import { router } from './routes';

export const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', router);

app.use(notFoundHandler);
app.use(globalErrorHandler);
