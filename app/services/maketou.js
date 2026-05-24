// 📦 app/services/maketou.js — MAKETOU API (Production Ready)
// Base: https://api.maketou.net | Auth: Bearer Token
// UUIDs: Particulier=d7925773-2d3e-43ff-8eac-077abc076840 | Entreprise=f0bff489-7851-4ba0-b1ea-e7e474337ecc

export const MAKETOU_CONFIG = {
  baseUrl: 'https://api.maketou.net',
  
  // 🔗 Endpoints RÉELS (confirmés par la doc MAKETOU)
  initiatePath: '/api/v1/stores/cart/checkout',  // POST - créer un panier/paiement
  statusPath: '/api/v1/stores/cart',              // GET /{cartId} - vérifier statut
  
  // 🔑 Clé API (depuis .env.local ou fallback)
  apiKey: process.env?.EXPO_PUBLIC_MAKETOU_API_KEY || 'msk_e36707db0536725209cde7a07017ce98e7409da60118b20167d3eb416222ad05',
  
  // 🛒 Product IDs RÉELS (depuis ton dashboard MAKETOU)
  productIds: {
    individual: 'd7925773-2d3e-43ff-8eac-077abc076840',  // ✅ Abonnement Particulier
    company: 'f0bff489-7851-4ba0-b1ea-e7e474337ecc'       // ✅ Abonnement Entreprise
  },
  
  // 🔄 URLs de retour
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel',
  
  // 🎛️ Mode simulation (false = paiements réels)
  simulationMode: false  // ✅ DÉSACTIVÉ pour production
};

// 🔗 Créer un panier et initier le paiement MAKETOU
export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  // Mode simulation (gardé pour tests futurs)
  if (MAKETOU_CONFIG.simulationMode) {
    console.log('🧪 Simulation mode - paiement factice');
    return {
      payment_url: `/simulate.html?order_id=${orderId}&amount=${amount}&planType=${planType}`,
      order_id: orderId,
      isSimulation: true
    };
  }
  
  // 🔍 Vérifier que le productDocumentId est configuré
  const productDocumentId = MAKETOU_CONFIG.productIds[planType];
  if (!productDocumentId) {
    throw new Error(`⚠️ productDocumentId non configuré pour "${planType}"`);
  }
  
  // 📝 Préparer le nom du client
  const nameParts = (displayName || email || 'Client').split(' ');
  const firstName = nameParts[0] || 'Client';
  const lastName = nameParts.slice(1).join(' ') || 'SikaKpe';
  
  try {
    const body = {
      productDocumentId,
      email,
      firstName,
      lastName,
      phone: '',
      redirectURL: MAKETOU_CONFIG.returnUrl,
      customerPrice: amount,  // ✅ Prix libre (produits configurés ainsi dans MAKETOU)
      meta: {
        uid: subscriptionId,
        planType,
        platform: 'web',
        originalAmount: amount
      }
    };

    console.log('📤 MAKETOU API request:', { 
      url: `${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`, 
      body: { ...body, productDocumentId: '***', apiKey: '***' } 
    });

    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('❌ MAKETOU API error:', response.status, error);
      throw new Error(error.message || error.code || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ MAKETOU API response:', { 
      cartId: data.cart?.id, 
      status: data.cart?.status, 
      redirectUrl: data.redirectUrl 
    });
    
    return {
      payment_url: data.redirectUrl,
      order_id: data.cart?.id || orderId,
      isSimulation: false
    };
    
  } catch (e) {
    console.error('❌ createPaymentLink error:', e);
    throw e;
  }
};

// 🔍 Vérifier le statut d'un panier via API MAKETOU
export const checkPaymentStatus = async (cartId) => {
  if (MAKETOU_CONFIG.simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return 'completed';
  }
  
  try {
    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.statusPath}/${cartId}`, {
      headers: { 'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}` }
    });
    
    if (!response.ok) {
      console.warn('⚠️ Status check failed:', response.status);
      return 'waiting_payment';
    }
    
    const data = await response.json();
    const status = data.status || 'waiting_payment';
    console.log(`🔍 Cart ${cartId} status: ${status}`);
    
    // Mapper les statuts MAKETOU vers nos statuts internes
    if (status === 'completed') return 'success';
    if (status === 'payment_failed' || status === 'abandoned') return 'failed';
    return 'pending';
    
  } catch (e) {
    console.warn('⚠️ checkPaymentStatus error:', e.message);
    return 'pending';
  }
};

// ⏱️ Polling du statut (max 2 minutes)
export const pollPaymentStatus = async (cartId, maxAttempts = 40, interval = 3000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkPaymentStatus(cartId);
    console.log(`🔍 Polling ${i+1}/${maxAttempts} | cart: ${cartId} | status: ${status}`);
    
    if (status === 'success') return 'success';
    if (status === 'failed') return 'failed';
    
    await new Promise(r => setTimeout(r, interval));
  }
  return 'timeout';
};

// 🎛️ Toggle simulation
export const setSimulationMode = (enabled) => {
  MAKETOU_CONFIG.simulationMode = enabled;
  console.log(`🧪 Simulation mode: ${enabled ? 'ON' : 'OFF'}`);
};

export default {
  config: MAKETOU_CONFIG,
  createPaymentLink,
  checkPaymentStatus,
  pollPaymentStatus,
  setSimulationMode
};
