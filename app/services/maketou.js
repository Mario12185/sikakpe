// 📦 app/services/maketou.js — Paiement MAKETOU (Version Simplifiée MVP)

// 🔧 Configuration globale (accessible partout)
export const MAKETOU_CONFIG = {
  paymentBaseUrl: 'https://maketou.com/pay',
  merchantId: 'MERCHANT_XXXX',
  publicKey: 'pk_test_XXXXXXXXXXXXXXXX',
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel',
  simulationMode: true  // ← true = mode test, false = production
};

// 🔗 Génère l'URL de paiement (simulation ou redirect)
export const createPaymentLink = ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  // Mode simulation : URL locale de test
  if (MAKETOU_CONFIG.simulationMode) {
    console.log('🧪 Simulation mode - paiement factice');
    return {
      payment_url: `/simulate.html?order_id=${orderId}&amount=${amount}&planType=${planType}`,
      order_id: orderId,
      isSimulation: true
    };
  }
  
  // Production : construction URL avec paramètres (à adapter selon doc MAKETOU)
  const params = new URLSearchParams({
    merchant_id: MAKETOU_CONFIG.merchantId,
    amount: amount.toString(),
    currency: currency,
    order_id: orderId,
    description: `Abonnement SikaKpɛ - ${planType === 'company' ? 'Entreprise' : 'Particulier'}`,
    customer_email: email,
    customer_name: displayName,
    return_url: MAKETOU_CONFIG.returnUrl,
    cancel_url: MAKETOU_CONFIG.cancelUrl
  });
  
  return { 
    payment_url: `${MAKETOU_CONFIG.paymentBaseUrl}?${params.toString()}`, 
    order_id: orderId, 
    isSimulation: false 
  };
};

// 🔍 Vérifie le statut (simulation uniquement pour MVP)
export const checkPaymentStatus = async (orderId) => {
  if (MAKETOU_CONFIG.simulationMode) {
    // Simulation : retourne 'success' après délai court
    await new Promise(resolve => setTimeout(resolve, 1500));
    return 'success';
  }
  // Production : à implémenter avec API réelle MAKETOU
  return 'pending';
};

// ⏱️ Polling simplifié
export const pollPaymentStatus = async (orderId, maxAttempts = 20, interval = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const status = await checkPaymentStatus(orderId);
      if (status === 'success' || status === 'completed') return 'success';
      if (status === 'failed' || status === 'cancelled') return 'failed';
    } catch (e) {
      console.warn('⚠️ Polling error:', e.message);
    }
    await new Promise(r => setTimeout(r, interval));
  }
  return 'timeout';
};

// 🎛️ Toggle simulation
export const setSimulationMode = (enabled) => {
  MAKETOU_CONFIG.simulationMode = enabled;
};

// ✅ Export par défaut pour compatibilité
export default {
  config: MAKETOU_CONFIG,
  createPaymentLink,
  checkPaymentStatus,
  pollPaymentStatus,
  setSimulationMode
};
