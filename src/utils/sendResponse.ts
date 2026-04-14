import { Request, Response } from 'express';

type SendResponseParams<T> = {
  statusCode: number;
  message: string;
  data?: T;
};

export const sendResponse = <T>(
  req: Request,
  res: Response,
  params: SendResponseParams<T>
): void => {
  const { statusCode, message, data } = params;

  res.status(statusCode).json({
    message,
    status: statusCode < 400,
    statusCode,
    path: req.originalUrl.split('?')[0],
    method: req.method,
    timestamp: new Date().toISOString(),
    data: data ?? null
  });
};
