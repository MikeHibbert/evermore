const notifier = require('node-notifier');
const Sentry = require("@sentry/node");
import {settings} from '../config';

export const showNotification = (message) => {
  try {
    notifier.notify({
        title: 'Evermore Datastore',
        icon: settings.NOTIFY_ICON_PATH,
        message: message,
        timeout: 2, 
        appID: settings.API_NOTIFIER_ID
    });
  } catch (e) {
    Sentry.captureException(e);
  }
}

export const showNotificationWithClickHandler = (message, clickHandler) => {
    try {
      notifier.notify({
          title: 'Evermore Datastore',
          icon: settings.NOTIFY_ICON_PATH,
          message: message,
          timeout: 2, 
          appID: settings.API_NOTIFIER_ID
      });
    } catch (e) {
      Sentry.captureException(e);
    }
}

const checkNotifierSettings = (notifier) => {
    let setting = null

      try {
        switch (notifier.setting) {
          case 0:
            // Everything is alright, let's show it
            return true
          case 1:
            // DisabledByManifest
            console.log('failed : Notifications are disabled by app manifest.');
            return false
          case 2:
            // DisabledByGroupPolicy
            console.log('failed: Notifications are disabled by Windows group policy.');
            return false
          case 3:
            // DisabledForUser
            console.log('failed: Notifications are disabled for this user (system-wide).');
            return false
          case 4:
            // DisabledForApplication
            console.log('failed: Notifications are disabled for this app only (in Windows settings).');
            return false
          default:
            return true
        }
      } catch (e) {
        Sentry.captureException(e);

        return true
      }
}