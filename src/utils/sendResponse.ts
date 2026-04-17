import { Request, Response } from 'express';

import { mapDatesToBangladeshTime, toBangladeshIsoString } from './time';

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
    timestamp: toBangladeshIsoString(new Date()),
    data: data == null ? null : mapDatesToBangladeshTime(data)
  });
};
