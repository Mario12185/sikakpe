// 📦 app/services/maketou.js — MAKETOU API DEBUG 422
// Cette version affiche TOUT pour identifier la cause exacte

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

// 🔗 Créer un panier — VERSION DEBUG MAX
export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  if (MAKETOU_CONFIG.simulationMode) {
    return { payment_url: `/simulate.html?order_id=${orderId}`, order_id: orderId, isSimulation: true };
  }
  
  const productDocumentId = MAKETOU_CONFIG.productIds[planType];
  if (!productDocumentId) throw new Error(`productDocumentId manquant pour "${planType}"`);
  
  // 📝 Noms sécurisés
  const cleanName = (displayName || email || 'Client SikaKpe').trim();
  const nameParts = cleanName.split(' ').filter(p => p.length > 0);
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.slice(1).join(' ') || 'SikaKpe';
  const customerPrice = Math.round(Number(amount) || 0);
  
  const body = {
    productDocumentId,
    email: email?.trim()?.toLowerCase(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: '',
    redirectURL: MAKETOU_CONFIG.returnUrl,
    customerPrice,
    meta: { uid: subscriptionId, planType, platform: 'web', originalAmount: amount }
  };

  // 🔍 LOG 1: Body envoyé (masqué partiellement)
  console.log('📤 MAKETOU request body:', JSON.stringify({
    ...body,
    productDocumentId: '***',
    email: '***',
    meta: { uid: '***' }
  }, null, 2));

  try {
    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    // 🔍 LOG 2: Réponse RAW avant tout traitement
    const rawText = await response.text();
    console.log('📥 MAKETOU raw response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: rawText
    });
    
    // Parser JSON si possible
    let responseData;
    try {
      responseData = JSON.parse(rawText);
    } catch {
      responseData = { raw: rawText };
    }
    
    if (!response.ok) {
      // 🔍 LOG 3: Extraction multi-niveaux de l'erreur
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
      
      console.error('❌ MAKETOU 422 DETAILS:', {
        status: response.status,
        code: responseData?.code,
        message_raw: responseData?.message,
        error_extracted: errorMsg,
        full_response: responseData
      });
      
      throw new Error(`MAKETOU ${response.status}: ${errorMsg}`);
    }
    
    console.log('✅ MAKETOU success:', responseData);
    return {
      payment_url: responseData.redirectUrl,
      order_id: responseData.cart?.id || orderId,
      isSimulation: false
    };
    
  } catch (e) {
    console.error('❌ createPaymentLink fatal:', {
      name: e.name,
      message: String(e.message),
      stack: e.stack?.split('\n')[0]
    });
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
