import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../core/errors/ApiError.js';

const STEADFAST_BASE_URL = 'https://portal.packzy.com/api/v1';

// Replace these with actual config/env logic for production
const getSteadfastHeaders = () => {
  const apiKey = process.env.STEADFAST_API_KEY;
  const secretKey = process.env.STEADFAST_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      'Steadfast API keys are not configured in the environment'
    );
  }

  return {
    'Api-Key': apiKey,
    'Secret-Key': secretKey,
    'Content-Type': 'application/json',
  };
};

const checkFraudStatus = async (phone: string) => {
  try {
    const response = await fetch(`${STEADFAST_BASE_URL}/fraud_check/${phone}`, {
      method: 'GET',
      headers: getSteadfastHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch from Steadfast Courier API');
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to connect to Steadfast Courier API'
    );
  }
};

export const steadfastService = {
  checkFraudStatus,
};
