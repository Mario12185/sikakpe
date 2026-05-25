// 📦 app/services/maketou.js — MAKETOU API (FIXED: phone + firstName)
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

// 🔗 Créer un panier — VERSION CORRIGÉE (phone + firstName)
export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  if (MAKETOU_CONFIG.simulationMode) {
    return { payment_url: `/simulate.html?order_id=${orderId}`, order_id: orderId, isSimulation: true };
  }
  
  const productDocumentId = MAKETOU_CONFIG.productIds[planType];
  if (!productDocumentId) throw new Error(`productDocumentId manquant pour "${planType}"`);
  
  // 👤 Récupérer le VRAI nom (displayName depuis Firestore ou fallback)
  let firstName = 'Client';
  let lastName = 'SikaKpe';
  
  if (displayName && typeof displayName === 'string' && displayName.trim().length > 0) {
    const cleanName = displayName.trim();
    const nameParts = cleanName.split(' ').filter(p => p.length > 0);
    firstName = nameParts[0] || 'Client';
    lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'SikaKpe';
  }
  // Fallback: utiliser l'email avant l'UID
  else if (email && email.includes('@')) {
    firstName = email.split('@')[0].split('.')[0] || 'Client';
    lastName = 'SikaKpe';
  }
  
  // 📞 Phone: envoyer SEULEMENT si format valide (+228XXXXXXXX)
  const phoneRegex = /^\+228[0-9]{8}$/;
  const phone = '';  // On ne l'envoie pas si vide/invalid
  
  // 💰 customerPrice en entier
  const customerPrice = Math.round(Number(amount) || 0);
  
  // 📦 Construire le body (NE PAS inclure phone si vide)
  const body = {
    productDocumentId,
    email: email?.trim()?.toLowerCase(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    redirectURL: MAKETOU_CONFIG.returnUrl,
    customerPrice,
    meta: { uid: subscriptionId, planType, platform: 'web', originalAmount: amount }
  };
  
  // Ajouter phone SEULEMENT si valide
  if (phone && phoneRegex.test(phone)) {
    body.phone = phone;
  }

  console.log('📤 MAKETOU request:', {
    url: `${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`,
    body: { ...body, productDocumentId: '***', email: '***', meta: { uid: '***' } },
    firstName, lastName, customerPrice
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
    
    const rawText = await response.text();
    let responseData;
    try { responseData = JSON.parse(rawText); } catch { responseData = { raw: rawText }; }
    
    if (!response.ok) {
      const extractError = (obj, depth = 0) => {
        if (depth > 3) return 'Too deep';
        if (!obj) return 'Empty';
        if (typeof obj === 'string') return obj;
        if (Array.isArray(obj)) return obj.map(v => extractError(v, depth+1)).join(', ');
        if (obj.message) return extractError(obj.message, depth+1);
        if (obj.error) return extractError(obj.error, depth+1);
        if (obj.errors) return extractError(obj.errors, depth+1);
        if (obj.details) return extractError(obj.details, depth+1);
        return JSON.stringify(obj);
      };
      
      const errorMsg = extractError(responseData);
      console.error('❌ MAKETOU error:', { status: response.status, message: errorMsg });
      throw new Error(`MAKETOU ${response.status}: ${errorMsg}`);
    }
    
    console.log('✅ MAKETOU success:', { cartId: responseData.cart?.id, redirectUrl: responseData.redirectUrl });
    return {
      payment_url: responseData.redirectUrl,
      order_id: responseData.cart?.id || orderId,
      isSimulation: false
    };
    
  } catch (e) {
    console.error('❌ createPaymentLink error:', e.message);
    throw e;
  }
};

// 🔍 Statut panier (inchangé)
export const checkPaymentStatus = async (cartId) => {
  if (MAKETOU_CONFIG.simulationMode) {
    await new Promise(r => setTimeout(r, 1500));
    return 'completed';
  }
  try {
    const res = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.statusPath}/${cartId}`, {
      headers: { 'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}` }
    });
    if (!res.ok) return 'waiting_payment';
    const data = await res.json();
    return data.status === 'completed' ? 'success' : 
           ['payment_failed','abandoned'].includes(data.status) ? 'failed' : 'pending';
  } catch { return 'pending'; }
};

export const pollPaymentStatus = async (cartId, maxAttempts = 40, interval = 3000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkPaymentStatus(cartId);
    if (status === 'success') return 'success';
    if (status === 'failed') return 'failed';
    await new Promise(r => setTimeout(r, interval));
  }
  return 'timeout';
};

export const setSimulationMode = (enabled) => { MAKETOU_CONFIG.simulationMode = enabled; };

export default { config: MAKETOU_CONFIG, createPaymentLink, checkPaymentStatus, pollPaymentStatus, setSimulationMode };
