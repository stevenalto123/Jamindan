import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Universal Haptic Feedback Utility for Jamindan Emergency Platform
 * Seamlessly supports both Capacitor native mobile apps and Web mobile browsers.
 */

export const triggerHaptic = async (pattern = 30) => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      const duration = Array.isArray(pattern) ? pattern[0] : pattern;
      await Haptics.vibrate({ duration: duration || 200 });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch (err) {
    // Graceful fallback for browsers where vibration permissions are restricted
  }
};

/** Quick subtle tap for buttons, chips, and menu selections */
export const hapticTap = async () => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      await Haptics.impact({ style: ImpactStyle.Light });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
  } catch (e) {
    // Ignore fallback
  }
};

/** Success notification pulse for saved states, check-ins, and copied numbers */
export const hapticSuccess = async () => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      await Haptics.notification({ type: NotificationType.Success });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([40, 60, 40]);
    }
  } catch (e) {
    // Ignore fallback
  }
};

/** Strong emergency pulse for SOS Panic button and life-safety direct dialing */
export const hapticEmergency = async () => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      await Haptics.vibrate({ duration: 350 });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([180, 80, 180]);
    }
  } catch (e) {
    // Ignore fallback
  }
};

/** Error or warning buzz */
export const hapticError = async () => {
  try {
    if (typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.()) {
      await Haptics.notification({ type: NotificationType.Error });
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  } catch (e) {
    // Ignore fallback
  }
};
