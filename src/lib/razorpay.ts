declare global {
  interface Window {
    Razorpay: any;
  }
}

// Razorpay Configuration
export const RAZORPAY_CONFIG = {
  key_id: 'rzp_test_RHpVquZ5e0nUkX',
  key_secret: 'C0qZuu2HhC7cLYUKBxlKI2at',
  currency: 'INR',
  company_name: 'Sanathan Rudraksha',
  description: 'Purchase of Spiritual Products'
};

export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const initializeRazorpay = (options: any) => {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay(options);
    
    rzp.on('payment.success', (response: any) => {
      resolve(response);
    });
    
    rzp.on('payment.failed', (response: any) => {
      reject(response);
    });
    
    rzp.open();
  });
};

export const createRazorpayOrder = async (amount: number, receipt: string) => {
  try {
    const response = await fetch('/api/payment/create-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount * 100, // Convert to paise
        currency: RAZORPAY_CONFIG.currency,
        receipt,
      }),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create order');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const verifyPayment = async (paymentData: any) => {
  try {
    const response = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Payment verification failed');
    }

    return data.data;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};