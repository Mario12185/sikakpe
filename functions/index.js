// functions/index.js — Webhook MAKETOU
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// 🔐 Clé secrète MAKETOU (récupérée via firebase functions:config:set)
const MAKETOU_SECRET = functions.config().maketou?.secret || '';

exports.maketouWebhook = functions.https.onRequest(async (req, res) => {
  // ✅ Autoriser les requêtes CORS (pour les préflights OPTIONS)
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST');
    res.set('Access-Control-Allow-Headers', 'Content-Type, x-maketou-signature');
    return res.status(204).send('');
  }

  // 🔐 Vérifier la signature HMAC (sécurité)
  const signature = req.headers['x-maketou-signature'];
  const payload = JSON.stringify(req.body);
  
  // En production : vérifier la signature
  if (MAKETOU_SECRET && signature) {
    const expectedSig = crypto.createHmac('sha256', MAKETOU_SECRET)
      .update(payload)
      .digest('hex');
    
    if (signature !== expectedSig) {
      console.error('❌ Signature HMAC invalide');
      return res.status(401).send('Unauthorized');
    }
  }

  const { order_id, status, amount, currency, metadata } = req.body;
  const uid = metadata?.uid;

  console.log(`🔔 Webhook reçu | order: ${order_id} | status: ${status} | uid: ${uid}`);

  if (!uid) {
    console.error('❌ UID manquant dans metadata');
    return res.status(400).json({ error: 'UID manquant' });
  }

  try {
    if (status === 'success' || status === 'completed') {
      // ✅ Activer l'abonnement
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 1);
      
      await db.collection('subscriptions').doc(uid).set({
        clientId: uid,
        amount: amount || 0,
        currency: currency || 'XOF',
        period: 'monthly',
        planType: metadata?.planType || 'individual',
        status: 'active',
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt,
        lastPaymentMethod: 'maketou',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        maketouOrderId: order_id
      }, { merge: true });

      // 🔔 Mettre à jour la transaction
      const transactionsRef = db.collection('transactions')
        .where('uid', '==', uid)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(1);
      
      const txSnap = await transactionsRef.get();
      if (!txSnap.empty) {
        await txSnap.docs[0].ref.update({ 
          status: 'success', 
          completedAt: admin.firestore.FieldValue.serverTimestamp(),
          maketouOrderId: order_id
        });
      }

      console.log(`✅ Abonnement activé pour ${uid}`);
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ success: true, message: 'Abonnement activé' });
      
    } else if (status === 'failed' || status === 'cancelled' || status === 'rejected') {
      // ❌ Marquer la transaction comme échouée
      const transactionsRef = db.collection('transactions')
        .where('uid', '==', uid)
        .where('status', '==', 'pending')
        .orderBy('createdAt', 'desc')
        .limit(1);
      
      const txSnap = await transactionsRef.get();
      if (!txSnap.empty) {
        await txSnap.docs[0].ref.update({ 
          status: status, 
          failedAt: admin.firestore.FieldValue.serverTimestamp(),
          maketouOrderId: order_id
        });
      }
      
      console.log(`❌ Paiement ${status} pour ${uid}`);
      res.set('Access-Control-Allow-Origin', '*');
      return res.status(200).json({ success: true, message: `Paiement ${status}` });
    }

    // Statut inconnu
    res.set('Access-Control-Allow-Origin', '*');
    return res.status(200).json({ success: true, message: 'Webhook reçu' });
    
  } catch (e) {
    console.error('❌ Webhook error:', e);
    res.set('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal error', message: e.message });
  }
});