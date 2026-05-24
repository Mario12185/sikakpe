// 📦 app/services/maketou.js — MAKETOU API (Production Ready)
// Base: https://api.maketou.net | Auth: Bearer Token

export const MAKETOU_CONFIG = {
  baseUrl: 'https://api.maketou.net',
  initiatePath: '/v1/checkout/sessions',
  statusPath: '/v1/checkout/sessions',
  apiKey: process.env?.EXPO_PUBLIC_MAKETOU_API_KEY || 'msk_e36707db0536725209cde7a07017ce98e7409da60118b20167d3eb416222ad05',
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel',
  simulationMode: false // ✅ DÉSACTIVÉ pour paiements réels
};

export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  if (MAKETOU_CONFIG.simulationMode) {
    console.log('🧪 Simulation mode - paiement factice');
    return { payment_url: `/simulate.html?order_id=${orderId}&amount=${amount}&planType=${planType}`, order_id: orderId, isSimulation: true };
  }

  try {
    const body = {
      amount: amount,
      currency: currency,
      order_id: orderId,
      description: `Abonnement SikaKpɛ - ${planType === 'company' ? 'Entreprise' : 'Particulier'}`,
      customer_email: email,
      customer_name: displayName,
      return_url: MAKETOU_CONFIG.returnUrl,
      cancel_url: MAKETOU_CONFIG.cancelUrl,
      metadata: { uid: subscriptionId, planType, platform: 'web' }
    };

    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}` },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      payment_url: data.payment_url || data.checkout_url || data.redirect_url || data.url,
      order_id: data.order_id || data.id || orderId,
      isSimulation: false
    };
  } catch (e) {
    console.error('❌ createPaymentLink error:', e);
    throw e;
  }
};

export const checkPaymentStatus = async (orderId) => {
  if (MAKETOU_CONFIG.simulationMode) { await new Promise(r => setTimeout(r, 1500)); return 'success'; }
  try {
    const res = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.statusPath}/${orderId}`, {
      headers: { 'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}` }
    });
    if (!res.ok) return 'pending';
    const data = await res.json();
    return data.status || data.state || data.payment_status || 'pending';
  } catch (e) { console.warn('⚠️ checkPaymentStatus error:', e.message); return 'pending'; }
};

export const pollPaymentStatus = async (orderId, maxAttempts = 20, interval = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkPaymentStatus(orderId);
    console.log(`🔍 Polling ${i+1}/${maxAttempts} | status: ${status}`);
    if (['success','completed','paid','succeeded'].includes(status)) return 'success';
    if (['failed','cancelled','rejected','expired'].includes(status)) return 'failed';
    await new Promise(r => setTimeout(r, interval));
  }
  return 'timeout';
};

export const setSimulationMode = (enabled) => { MAKETOU_CONFIG.simulationMode = enabled; };
export default { config: MAKETOU_CONFIG, createPaymentLink, checkPaymentStatus, pollPaymentStatus, setSimulationMode };
