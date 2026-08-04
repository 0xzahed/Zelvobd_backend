import crypto from 'crypto';

interface CapiPayload {
  eventName: string;
  eventTime: number;
  eventSourceUrl?: string;
  userData: {
    fbp?: string | null;
    fbc?: string | null;
    clientIpAddress?: string | null;
    clientUserAgent?: string | null;
    phone?: string | null;
  };
  customData?: {
    value?: number;
    currency?: string;
    orderId?: string;
  };
}

const hashData = (data?: string | null) => {
  if (!data) return undefined;
  // Meta requires phone numbers to include country code and no symbols. 
  // We'll strip non-digits. If BD number, prepend 88 if missing.
  let cleanPhone = data.replace(/\D/g, '');
  if (cleanPhone.length === 11 && cleanPhone.startsWith('01')) {
    cleanPhone = '88' + cleanPhone;
  }
  return crypto.createHash('sha256').update(cleanPhone).digest('hex');
};

export const sendMetaEvent = async (payload: CapiPayload) => {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!pixelId || !accessToken) {
    console.warn('Meta CAPI is not configured. Missing META_PIXEL_ID or META_ACCESS_TOKEN');
    return;
  }

  const { eventName, eventTime, eventSourceUrl, userData, customData } = payload;

  const data = [
    {
      event_name: eventName,
      event_time: eventTime,
      action_source: 'website',
      event_source_url: eventSourceUrl || process.env.FRONTEND_BASE_URL,
      user_data: {
        client_ip_address: userData.clientIpAddress || undefined,
        client_user_agent: userData.clientUserAgent || undefined,
        fbp: userData.fbp || undefined,
        fbc: userData.fbc || undefined,
        ph: userData.phone ? [hashData(userData.phone)] : undefined,
      },
      custom_data: {
        value: customData?.value,
        currency: customData?.currency || 'BDT',
        order_id: customData?.orderId,
      },
    },
  ];

  try {
    const response = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data }),
    });

    const result = await response.json();
    if (!response.ok) {
      console.error('Meta CAPI Error:', JSON.stringify(result));
    } else {
      console.log('Meta CAPI Success:', result.events_received);
    }
  } catch (error) {
    console.error('Meta CAPI Request Failed:', error);
  }
};
