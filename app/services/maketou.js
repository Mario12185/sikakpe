// 📦 app/services/maketou.js — MAKETOU API (Production Ready - FIXED 422)
// Base: https://api.maketou.net | Auth: Bearer Token

export const MAKETOU_CONFIG = {
  baseUrl: 'https://api.maketou.net',
  initiatePath: '/api/v1/stores/cart/checkout',
  statusPath: '/api/v1/stores/cart',
  apiKey: process.env?.EXPO_PUBLIC_MAKETOU_API_KEY || 'msk_e36707db0536725209cde7a07017ce98e7409da60118b20167d3eb416222ad05',
  productIds: {
    individual: 'd7925773-2d3e-43ff-8eac-077abc076840',
    company: 'f0bff489-7851-4ba0-b1ea-e7e474337ecc'
  },
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel',
  simulationMode: false
};

// 🔗 Créer un panier et initier le paiement MAKETOU (VERSION CORRIGÉE 422)
export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  if (MAKETOU_CONFIG.simulationMode) {
    console.log('🧪 Simulation mode');
    return { payment_url: `/simulate.html?order_id=${orderId}`, order_id: orderId, isSimulation: true };
  }
  
  const productDocumentId = MAKETOU_CONFIG.productIds[planType];
  if (!productDocumentId) {
    throw new Error(`productDocumentId manquant pour "${planType}"`);
  }
  
  // 📝 Préparer le nom du client (sécurisé contre les chaînes vides)
  const cleanName = (displayName || email || 'Client SikaKpe').trim();
  const nameParts = cleanName.split(' ').filter(p => p.length > 0);
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'SikaKpe';
  
  // 💰 customerPrice DOIT être un entier (pas de décimales)
  const customerPrice = Math.round(Number(amount) || 0);
  
  const body = {
    productDocumentId,
    email: email?.trim()?.toLowerCase(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: '',
    redirectURL: MAKETOU_CONFIG.returnUrl,
    customerPrice,  // ✅ Entier obligatoire
    meta: {
      uid: subscriptionId,
      planType,
      platform: 'web',
      originalAmount: amount
    }
  };

  // 🔍 Log détaillé pour debug (masque les infos sensibles)
  console.log('📤 MAKETOU API request:', {
    url: `${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`,
    body: {
      ...body,
      productDocumentId: '***',
      email: '***',
      meta: { uid: '***' }
    },
    customerPrice_type: typeof customerPrice,
    customerPrice_value: customerPrice
  });

  try {
    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    const responseData = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      // 🔍 EXTRACTION CORRECTE de l'erreur (message est un tableau !)
      const errorMsg = Array.isArray(responseData.message) 
        ? responseData.message.join(', ') 
        : responseData.message || responseData.error || `HTTP ${response.status}`;
      
      console.error('❌ MAKETOU API error:', {
        status: response.status,
        code: responseData.code,
        message: responseData.message,
        fullResponse: responseData
      });
      
      throw new Error(errorMsg);
    }
    
    console.log('✅ MAKETOU API response:', {
      cartId: responseData.cart?.id,
      status: responseData.cart?.status,
      redirectUrl: responseData.redirectUrl
    });
    
    return {
      payment_url: responseData.redirectUrl,
      order_id: responseData.cart?.id || orderId,
      isSimulation: false
    };
    
  } catch (e) {
    console.error('❌ createPaymentLink error:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    throw e;
  }
};

// 🔍 Vérifier le statut d'un panier
export const checkPaymentStatus = async (cartId) => {
  if (MAKETOU_CONFIG.simulationMode) {
    await new Promise(r => setTimeout(r, 1500));
    return 'completed';
  }
  
  try {
    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.statusPath}/${cartId}`, {
      headers: { 'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}` }
    });
    
    if (!response.ok) return 'waiting_payment';
    
    const data = await response.json();
    const status = data.status || 'waiting_payment';
    
    if (status === 'completed') return 'success';
    if (status === 'payment_failed' || status === 'abandoned') return 'failed';
    return 'pending';
    
  } catch (e) {
    console.warn('⚠️ checkPaymentStatus error:', e.message);
    return 'pending';
  }
};

// ⏱️ Polling du statut
export const pollPaymentStatus = async (cartId, maxAttempts = 40, interval = 3000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkPaymentStatus(cartId);
    console.log(`🔍 Polling ${i+1}/${maxAttempts} | status: ${status}`);
    
    if (status === 'success') return 'success';
    if (status === 'failed') return 'failed';
    
    await new Promise(r => setTimeout(r, interval));
  }
  return 'timeout';
};

export const setSimulationMode = (enabled) => {
  MAKETOU_CONFIG.simulationMode = enabled;
};

export default {
  config: MAKETOU_CONFIG,
  createPaymentLink,
  checkPaymentStatus,
  pollPaymentStatus,
  setSimulationMode
};
