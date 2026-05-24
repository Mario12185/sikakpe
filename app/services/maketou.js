// 📦 app/services/maketou.js — MAKETOU API Intégration (Production Ready)
// Base: https://api.maketou.net | Auth: Bearer Token

export const MAKETOU_CONFIG = {
  // ✅ URLs de base
  baseUrl: 'https://api.maketou.net',
  
  // 🔗 Endpoints (à confirmer avec la doc MAKETOU - valeurs typiques)
  initiatePath: '/v1/checkout/sessions',   // POST - créer un paiement
  statusPath: '/v1/checkout/sessions',     // GET /{id} - vérifier statut
  
  // 🔑 Clé API (chargée depuis .env.local en production)
  apiKey: process.env?.EXPO_PUBLIC_MAKETOU_API_KEY || 'msk_e36707db0536725209cde7a07017ce98e7409da60118b20167d3eb416222ad05',
  
  // 🔄 URLs de retour
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel',
  
  // 🎛️ Mode simulation (true = test local, false = paiements réels)
  simulationMode: true  // ← Garder true pour tester d'abord sans débiter
};

// 🔗 Créer une session de paiement MAKETOU
export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  // Mode simulation : retourne URL locale de test
  if (MAKETOU_CONFIG.simulationMode) {
    console.log('🧪 Simulation mode - paiement factice');
    return {
      payment_url: `/simulate.html?order_id=${orderId}&amount=${amount}&planType=${planType}`,
      order_id: orderId,
      isSimulation: true
    };
  }
  
  // Production : Appel API MAKETOU
  try {
    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.initiatePath}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}`
      },
      body: JSON.stringify({
        amount: Math.round(amount * 1.08), // +8% frais API MAKETOU
        currency: currency,
        order_id: orderId,
        description: `Abonnement SikaKpɛ - ${planType === 'company' ? 'Entreprise' : 'Particulier'}`,
        customer_email: email,
        customer_name: displayName,
        return_url: MAKETOU_CONFIG.returnUrl,
        cancel_url: MAKETOU_CONFIG.cancelUrl,
        metadata: { uid: subscriptionId, planType, platform: 'web' }
      })
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
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

// 🔍 Vérifier le statut d'un paiement
export const checkPaymentStatus = async (orderId) => {
  if (MAKETOU_CONFIG.simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 1500));
    return 'success';
  }
  
  try {
    const response = await fetch(`${MAKETOU_CONFIG.baseUrl}${MAKETOU_CONFIG.statusPath}/${orderId}`, {
      headers: { 'Authorization': `Bearer ${MAKETOU_CONFIG.apiKey}` }
    });
    
    if (!response.ok) return 'pending';
    
    const data = await response.json();
    return data.status || data.state || data.payment_status || 'pending';
    
  } catch (e) {
    console.warn('⚠️ checkPaymentStatus error:', e.message);
    return 'pending';
  }
};

// ⏱️ Polling du statut
export const pollPaymentStatus = async (orderId, maxAttempts = 20, interval = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const status = await checkPaymentStatus(orderId);
    console.log(`🔍 Polling ${i+1}/${maxAttempts} | status: ${status}`);
    
    if (['success', 'completed', 'paid', 'succeeded'].includes(status)) return 'success';
    if (['failed', 'cancelled', 'rejected', 'expired'].includes(status)) return 'failed';
    
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
