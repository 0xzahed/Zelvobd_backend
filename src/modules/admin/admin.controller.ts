
import { Request } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcryptjs';

import { ApiError } from '../../core/errors/ApiError';
import { catchAsync } from '../../utils/catchAsync';
import { sendResponse } from '../../utils/sendResponse';
import { adminService } from './admin.service';
import { createAdminSchema, updateAdminSchema } from './admin.validation';

const getAdminIdFromParams = (req: Request): string => {
	const adminId = req.params.id;

	if (typeof adminId !== 'string' || adminId.length === 0) {
		throw new ApiError(StatusCodes.BAD_REQUEST, 'Admin id is required');
	}

	return adminId;
};

const createAdmin = catchAsync(async (req, res) => {
	const parsed = createAdminSchema.safeParse(req.body);

	if (!parsed.success) {
		throw new ApiError(StatusCodes.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid payload');
	}

	const { email, password, isActive } = parsed.data;
	const hashedPassword = await bcrypt.hash(password, 12);
	const admin = await adminService.createAdmin({ email, password: hashedPassword, isActive });

	sendResponse(req, res, {
		statusCode: StatusCodes.CREATED,
		message: 'Admin created successfully',
		data: admin
	});
});

const getAllAdmins = catchAsync(async (req, res) => {
	const admins = await adminService.getAllAdmins();

	sendResponse(req, res, {
		statusCode: StatusCodes.OK,
		message: 'Admins fetched successfully',
		data: admins
	});
});

const updateAdmin = catchAsync(async (req, res) => {
	const adminId = getAdminIdFromParams(req);
	const parsed = updateAdminSchema.safeParse(req.body);

	if (!parsed.success) {
		throw new ApiError(StatusCodes.BAD_REQUEST, parsed.error.issues[0]?.message ?? 'Invalid payload');
	}

	const updateData = {
		...parsed.data,
		password: parsed.data.password ? await bcrypt.hash(parsed.data.password, 12) : undefined
	};

	const admin = await adminService.updateAdmin(adminId, updateData);

	sendResponse(req, res, {
		statusCode: StatusCodes.OK,
		message: 'Admin updated successfully',
		data: admin
	});
});

const deleteAdmin = catchAsync(async (req, res) => {
	const adminId = getAdminIdFromParams(req);

	await adminService.deleteAdmin(adminId);

	sendResponse(req, res, {
		statusCode: StatusCodes.OK,
		message: 'Admin deleted successfully',
		data: null
	});
});

export const adminController = {
	createAdmin,
	getAllAdmins,
	updateAdmin,
	deleteAdmin
};
