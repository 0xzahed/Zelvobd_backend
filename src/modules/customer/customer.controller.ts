import { StatusCodes } from 'http-status-codes';

import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { customerService } from './customer.service.js';
import { getCustomersQuerySchema } from './customer.validation.js';

const getValidationErrorMessage = (error: { issues: Array<{ message?: string }> }): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const getCustomers = catchAsync(async (req, res) => {
  const parsedQuery = getCustomersQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    sendResponse(req, res, {
      statusCode: StatusCodes.BAD_REQUEST,
      message: getValidationErrorMessage(parsedQuery.error),
      data: null
    });
    return;
  }

  const result = await customerService.getCustomers(parsedQuery.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Customers fetched successfully',
    data: {
      meta: result.meta,
      customers: result.data
    }
  });
});

const getCustomerStats = catchAsync(async (req, res) => {
  const stats = await customerService.getCustomerStats();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Customer stats fetched successfully',
    data: stats
  });
});

export const customerController = {
  getCustomers,
  getCustomerStats
};
