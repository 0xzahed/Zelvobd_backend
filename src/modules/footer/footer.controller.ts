import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { ApiError } from '../../core/errors/ApiError.js';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { getFooterData, updateFooterData } from './footer.service.js';
import { updateFooterSchema } from './footer.validation.js';

const getValidationErrorMessage = (error: z.ZodError): string => {
  return error.issues[0]?.message ?? 'Validation failed';
};

const parseBody = (req: any): Record<string, any> => {
  const contentType = req.headers['content-type'] || '';

  if (contentType.includes('multipart/form-data')) {
    const body: Record<string, any> = {};

    if (req.body?.brandName) body.brandName = req.body.brandName;
    if (req.body?.brandTagline !== undefined) body.brandTagline = req.body.brandTagline;
    if (req.body?.supportEmail !== undefined) body.supportEmail = req.body.supportEmail;
    if (req.body?.supportPhone !== undefined) body.supportPhone = req.body.supportPhone;
    if (req.body?.supportAddress !== undefined) body.supportAddress = req.body.supportAddress;
    if (req.body?.logoUrl !== undefined) body.logoUrl = req.body.logoUrl;

    if (req.body?.navGroups) {
      try {
        body.navGroups = typeof req.body.navGroups === 'string' ? JSON.parse(req.body.navGroups) : req.body.navGroups;
      } catch { body.navGroups = []; }
    }
    if (req.body?.socials) {
      try {
        body.socials = typeof req.body.socials === 'string' ? JSON.parse(req.body.socials) : req.body.socials;
      } catch { body.socials = []; }
    }

    if (req.file) {
      body.logoUrl = `/upload/footer/${req.file.filename}`;
    }

    return body;
  }

  return req.body || {};
};

const getFooter = catchAsync(async (req, res) => {
  const data = await getFooterData();

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Footer data fetched successfully',
    data
  });
});

const patchFooter = catchAsync(async (req, res) => {
  const body = parseBody(req);

  const parsedBody = updateFooterSchema.safeParse(body);

  if (!parsedBody.success) {
    throw new ApiError(StatusCodes.BAD_REQUEST, getValidationErrorMessage(parsedBody.error));
  }

  const data = await updateFooterData(parsedBody.data);

  sendResponse(req, res, {
    statusCode: StatusCodes.OK,
    message: 'Footer data updated successfully',
    data
  });
});

export const footerController = {
  getFooter,
  patchFooter
};
