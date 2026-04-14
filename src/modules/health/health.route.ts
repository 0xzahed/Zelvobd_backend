import { Router } from 'express';

import { sendResponse } from '../../utils/sendResponse';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  sendResponse(req, res, {
    statusCode: 200,
    message: 'Ecommerce backend is running',
    data: {
      service: 'ecommerce-backend',
      uptime: process.uptime()
    }
  });
});
