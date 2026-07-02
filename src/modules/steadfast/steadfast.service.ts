import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../../core/errors/ApiError.js';
import { prisma } from '../../lib/prisma.js';

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

const checkDeliveryStatus = async (invoice: string) => {
  try {
    const response = await fetch(`${STEADFAST_BASE_URL}/status_by_invoice/${invoice}`, {
      method: 'GET',
      headers: getSteadfastHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch delivery status from Steadfast');
    }

    return data;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    
    throw new ApiError(
      StatusCodes.INTERNAL_SERVER_ERROR,
      error.message || 'Failed to fetch delivery status from Steadfast'
    );
  }
};

const syncOrders = async (orderIds: string[]) => {
  if (!orderIds || orderIds.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'No orders selected');
  }

  // 1. Fetch orders from DB
  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds } }
  });

  if (orders.length === 0) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'No valid orders found');
  }

  // 2. Filter orders that are already synced
  const unsyncedOrders = orders.filter(o => !o.consignmentId);
  
  if (unsyncedOrders.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'All selected orders are already synced to Steadfast');
  }

  const results = {
    success: 0,
    failed: 0,
    errors: [] as any[]
  };

  const headers = getSteadfastHeaders();

  // 3. Single Create Logic
  if (unsyncedOrders.length === 1) {
    const order = unsyncedOrders[0];
    const payload = {
      invoice: order.code,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_address: order.address,
      cod_amount: Number(order.total),
      note: order.orderNotes || ''
    };

    try {
      const response = await fetch(`${STEADFAST_BASE_URL}/create_order`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (response.ok && data.status === 200 && data.consignment?.consignment_id) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            consignmentId: String(data.consignment.consignment_id),
            trackingCode: data.consignment.tracking_code,
            status: 'PROCESSING'
          }
        });
        results.success = 1;
      } else {
        results.failed = 1;
        results.errors.push({ invoice: order.code, error: data });
      }
    } catch (err: any) {
      results.failed = 1;
      results.errors.push({ invoice: order.code, error: err.message });
    }
  } 
  // 4. Bulk Create Logic
  else {
    const payloadData = unsyncedOrders.map(order => ({
      invoice: order.code,
      recipient_name: order.customerName,
      recipient_phone: order.customerPhone,
      recipient_address: order.address,
      cod_amount: Number(order.total),
      note: order.orderNotes || ''
    }));

    try {
      const response = await fetch(`${STEADFAST_BASE_URL}/create_order/bulk-order`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ data: payloadData })
      });
      const data = await response.json();

      if (response.ok && data.status === 200 && Array.isArray(data.data)) {
        // Update database for successfully created items
        const updatePromises = data.data.map(async (item: any) => {
          if (item.status === 'success' && item.consignment_id) {
            results.success += 1;
            // Map Steadfast invoice back to local order code to find the ID
            const localOrder = unsyncedOrders.find(o => o.code === item.invoice);
            if (localOrder) {
              return prisma.order.update({
                where: { id: localOrder.id },
                data: {
                  consignmentId: String(item.consignment_id),
                  trackingCode: String(item.tracking_code),
                  status: 'PROCESSING'
                }
              });
            }
          } else {
            results.failed += 1;
            results.errors.push({ invoice: item.invoice, error: item });
          }
        });
        await Promise.all(updatePromises);
      } else {
        throw new Error('Bulk API response was invalid');
      }
    } catch (err: any) {
      throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, `Bulk Create Failed: ${err.message}`);
    }
  }

  return results;
};

export const steadfastService = {
  checkFraudStatus,
  syncOrders,
  checkDeliveryStatus
};
