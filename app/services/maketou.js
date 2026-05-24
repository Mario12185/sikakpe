// 📦 app/services/maketou.js — Paiement MAKETOU (MVP sans Cloud Functions)

const MAKETOU_CONFIG = {
  publicKey: 'pk_test_XXXXXXXXXXXXXXXX',  // ← Remplace par ta clé publique MAKETOU
  merchantId: 'MERCHANT_XXXX',             // ← Remplace par ton ID marchand
  returnUrl: 'https://sikakpe-togo.web.app/abonnement/success',
  cancelUrl: 'https://sikakpe-togo.web.app/abonnement/cancel'
};

// 🔗 Génère l'URL de paiement MAKETOU
export const createPaymentLink = async ({ amount, currency = 'XOF', email, displayName, planType, subscriptionId }) => {
  const payload = {
    merchant_id: MAKETOU_CONFIG.merchantId,
    amount: amount,
    currency: currency,
    order_id: `SikaKpe_${subscriptionId}_${Date.now()}`,
    description: `Abonnement SikaKpɛ - ${planType === 'company' ? 'Entreprise' : 'Particulier'}`,
    customer_email: email,
    customer_name: displayName,
    return_url: MAKETOU_CONFIG.returnUrl,
    cancel_url: MAKETOU_CONFIG.cancelUrl,
    metadata: { uid: subscriptionId, planType, platform: 'web' }
  };

  const response = await fetch('https://api.maketou.com/v1/payment/initiate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MAKETOU_CONFIG.publicKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Échec de l\'initialisation du paiement');
  }

  const data = await response.json();
  return { payment_url: data.payment_url, order_id: payload.order_id };
};

// 🔍 Vérifie le statut d'un paiement via l'API publique MAKETOU
export const checkPaymentStatus = async (orderId) => {
  const response = await fetch(`https://api.maketou.com/v1/payment/status/${orderId}`, {
    headers: { 'Authorization': `Bearer ${MAKETOU_CONFIG.publicKey}` }
  });
  const data = await response.json();
  return data.status; // 'pending' | 'success' | 'failed' | 'cancelled'
};

// ⏱️ Fonction de polling : vérifie toutes les 3 secondes pendant 2 minutes max
export const pollPaymentStatus = async (orderId, maxAttempts = 40, interval = 3000) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const status = await checkPaymentStatus(orderId);
    console.log(`🔍 Polling attempt ${attempt}/${maxAttempts} | status: ${status}`);
    
    if (status === 'success' || status === 'completed') return 'success';
    if (status === 'failed' || status === 'cancelled' || status === 'rejected') return 'failed';
    
    // Attendre avant le prochain essai
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  return 'timeout';
};

export default { createPaymentLink, checkPaymentStatus, pollPaymentStatus, config: MAKETOU_CONFIG };
