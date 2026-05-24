// 📦 app/services/maketou.js — Paiement MAKETOU (MVP Redirect + Simulation)

const MAKETOU_CONFIG = {
  // 🔗 URL de paiement MAKETOU (à confirmer avec leur documentation)
  paymentBaseUrl: 'https://maketou.com/pay',  // ← Remplace par l'URL réelle fournie par MAKETOU
  
  // 🔑 Identifiants (à récupérer depuis ton espace marchand MAKETOU)
  merchantId: 'MERCHANT_XXXX',
  publicKey: 'pk_test_XXXXXXXXXXXXXXXX',
  
  // 🔄 URLs de retour
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel',
  
  // 🧪 Mode simulation (pour tester sans paiement réel)
  simulationMode: true  // ← Mettre à false en production
};

// 🔗 Génère l'URL de paiement MAKETOU avec paramètres URL (pas d'appel API)
export const createPaymentLink = ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const orderId = `SikaKpe_${subscriptionId}_${Date.now()}`;
  
  // Si mode simulation : retourne une URL locale de test
  if (MAKETOU_CONFIG.simulationMode) {
    console.log('🧪 Simulation mode - paiement factice');
    return {
      payment_url: `https://sikakpe-togo.web.app/abonnement/simulate?order_id=${orderId}&amount=${amount}&planType=${planType}`,
      order_id: orderId,
      isSimulation: true
    };
  }
  
  // Construction de l'URL MAKETOU avec paramètres (format typique des gateways)
  const params = new URLSearchParams({
    merchant_id: MAKETOU_CONFIG.merchantId,
    amount: amount.toString(),
    currency: currency,
    order_id: orderId,
    description: `Abonnement SikaKpɛ - ${planType === 'company' ? 'Entreprise' : 'Particulier'}`,
    customer_email: email,
    customer_name: displayName,
    return_url: MAKETOU_CONFIG.returnUrl,
    cancel_url: MAKETOU_CONFIG.cancelUrl,
    metadata: JSON.stringify({ uid: subscriptionId, planType, platform: 'web' })
  });
  
  const payment_url = `${MAKETOU_CONFIG.paymentBaseUrl}?${params.toString()}`;
  console.log('🔗 Payment URL generated:', payment_url);
  
  return { payment_url, order_id: orderId, isSimulation: false };
};

// 🔍 Vérifie le statut d'un paiement (simulation ou API réelle)
export const checkPaymentStatus = async (orderId) => {
  // En mode simulation : retourne 'success' après 2 secondes pour tester
  if (MAKETOU_CONFIG.simulationMode) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('🧪 Simulation: payment status = success');
    return 'success';
  }
  
  // En production : appeler l'API de statut MAKETOU (si disponible)
  // const response = await fetch(`https://api.maketou.com/v1/payment/status/${orderId}`, { ... });
  // return response.json().then(data => data.status);
  
  // Fallback : retourner 'pending' en attendant l'intégration réelle
  return 'pending';
};

// ⏱️ Fonction de polling : vérifie toutes les 3 secondes pendant 2 minutes max
export const pollPaymentStatus = async (orderId, maxAttempts = 40, interval = 3000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await checkPaymentStatus(orderId);
    console.log(`🔍 Polling attempt ${attempt}/${maxAttempts} | status: ${status}`);
    
    if (status === 'success' || status === 'completed') return 'success';
    if (status === 'failed' || status === 'cancelled' || status === 'rejected') return 'failed';
    
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return 'timeout';
};

// 🎛️ Activer/désactiver le mode simulation
export const setSimulationMode = (enabled) => {
  MAKETOU_CONFIG.simulationMode = enabled;
  console.log(`🧪 Simulation mode: ${enabled ? 'ON' : 'OFF'}`);
};

export default { 
  createPaymentLink, 
  checkPaymentStatus, 
  pollPaymentStatus, 
  setSimulationMode,
  config: MAKETOU_CONFIG 
};
