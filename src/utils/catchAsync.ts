import { NextFunction, Request, RequestHandler, Response } from 'express';

type AsyncRouteHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<unknown> | unknown;

type CatchAsyncOptions = {
  onError?: (req: Request, res: Response, next: NextFunction) => Promise<void> | void;
};

export const catchAsync = (fn: AsyncRouteHandler, options?: CatchAsyncOptions): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(async (error) => {
      if (options?.onError) {
        await options.onError(req, res, next);
      }

      next(error);
    });
  };
};
