
import { StatusCodes } from 'http-status-codes';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { ApiError } from '../../core/errors/ApiError';
import { prisma } from '../../lib/prisma';

type CreateAdminPayload = {
	email: string;
	password: string;
	isActive?: boolean;
};

type UpdateAdminPayload = {
	email?: string;
	password?: string;
	isActive?: boolean;
};

const adminSelect = {
	id: true,
	email: true,
	isActive: true,
	createdAt: true,
	updatedAt: true
} as const;

const createAdmin = async (payload: CreateAdminPayload) => {
	try {
		const admin = await prisma.admin.create({
			data: {
				email: payload.email.toLowerCase(),
				password: payload.password,
				isActive: payload.isActive ?? true
			},
			select: adminSelect
		});
		return admin;
	} catch (error) {
		if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
			throw new ApiError(StatusCodes.CONFLICT, 'Admin email already exists');
		}
		throw error;
	}
};

const getAllAdmins = async () => {
	return prisma.admin.findMany({ select: adminSelect });
};

const updateAdmin = async (id: string, payload: UpdateAdminPayload) => {
	try {
		const admin = await prisma.admin.update({
			where: { id },
			data: {
				...payload,
				email: payload.email?.toLowerCase()
			},
			select: adminSelect
		});
		return admin;
	} catch (error) {
		if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
			throw new ApiError(StatusCodes.NOT_FOUND, 'Admin not found');
		}
		throw error;
	}
};

const deleteAdmin = async (id: string) => {
	try {
		await prisma.admin.delete({ where: { id } });
	} catch (error) {
		if (error instanceof PrismaClientKnownRequestError && error.code === 'P2025') {
			throw new ApiError(StatusCodes.NOT_FOUND, 'Admin not found');
		}
		throw error;
	}
};

export const adminService = {
	createAdmin,
	getAllAdmins,
	updateAdmin,
	deleteAdmin
};
