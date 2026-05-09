import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

/**
 * Cloud Function triggered when a new document is created in the "notifications" collection.
 * It reads the fcmTokens collection to find the user's registered FCM tokens,
 * checks their notification preferences, and sends a push notification.
 */
export const sendPushNotification = functions.firestore
  .document('notifications/{notifId}')
  .onCreate(async (snap, context) => {
    const notif = snap.data();
    
    if (!notif || !notif.userId) {
      console.log('No notification data or userId found.');
      return null;
    }

    const userId = notif.userId;
    const type = notif.type; // 'chat_message', 'workout_assigned', etc.

    // 1. Check user preferences
    const prefSnap = await admin.firestore().collection('notificationPreferences').doc(userId).get();
    let shouldSend = true;

    if (prefSnap.exists) {
      const prefs = prefSnap.data();
      if (prefs) {
        if (type === 'chat_message' && prefs.chatMessages === false) shouldSend = false;
        else if (type === 'workout_assigned' && prefs.workoutUpdates === false) shouldSend = false;
        else if (type === 'nutrition_updated' && prefs.nutritionUpdates === false) shouldSend = false;
        else if ((type === 'checkin_reviewed' || type === 'checkin_submitted') && prefs.checkinUpdates === false) shouldSend = false;
        else if (type === 'subscription_update' && prefs.subscriptionUpdates === false) shouldSend = false;
      }
    }

    if (!shouldSend) {
      console.log(`Notification of type ${type} disabled by user ${userId}.`);
      return null;
    }

    // 2. Get user's FCM tokens
    const tokensSnap = await admin.firestore()
      .collection('fcmTokens')
      .where('uid', '==', userId)
      .get();
    
    const tokens = tokensSnap.docs.map(d => d.data().token);
    
    if (tokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}.`);
      return null;
    }

    // 3. Send the push notification
    const payload = {
      notification: {
        title: notif.title || 'إشعار جديد',
        body: notif.body || '',
      },
      data: {
        type: notif.type || 'general',
        id: context.params.notifId,
        click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard default for PWA/Web/Mobile
      },
      tokens: tokens,
    };

    try {
      const response = await admin.messaging().sendEachForMulticast(payload);
      console.log(`Successfully sent message to ${response.successCount} devices.`);
      
      // Remove invalid tokens if any
      if (response.failureCount > 0) {
        const failedTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            failedTokens.push(tokens[idx]);
          }
        });
        
        console.log(`Removing ${failedTokens.length} failed tokens...`);
        const batch = admin.firestore().batch();
        tokensSnap.docs.forEach(doc => {
          if (failedTokens.includes(doc.data().token)) {
            batch.delete(doc.ref);
          }
        });
        await batch.commit();
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
    
    return null;
  });
