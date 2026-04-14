import { Router } from 'express';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Ecommerce backend is running',
    data: {
      service: 'ecommerce-backend',
      uptime: process.uptime()
    }
  });
});
