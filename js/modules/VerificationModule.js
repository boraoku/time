// Time Verification Module - Client-side version
import { TimeVerificationService } from '../TimeVerificationService.js';

export const VerificationModule = {
  verificationCache: new Map(),
  pendingVerifications: new Set(),
  CACHE_DURATION_MS: 24 * 60 * 60 * 1000, // 24 hours
  STORAGE_KEY: 'time_verification_cache',

  init() {
    this.loadCache();
    this.setupCleanupInterval();
  },

  loadCache() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        const now = Date.now();
        Object.entries(data).forEach(([key, value]) => {
          if (value.timestamp) {
            const cacheDuration = value.cacheDuration || this.CACHE_DURATION_MS;
            if ((now - value.timestamp) < cacheDuration) {
              this.verificationCache.set(key, value);
            }
          }
        });
      }
    } catch (error) {
      console.error('Failed to load verification cache:', error);
    }
  },

  saveCache() {
    try {
      const data = {};
      this.verificationCache.forEach((value, key) => {
        data[key] = value;
      });
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save verification cache:', error);
    }
  },

  setupCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      this.verificationCache.forEach((value, key) => {
        const cacheDuration = value.cacheDuration || this.CACHE_DURATION_MS;
        if ((now - value.timestamp) >= cacheDuration) {
          this.verificationCache.delete(key);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.saveCache();
      }
    }, 60 * 1000);
  },

  getCacheKey(city) {
    return city.toLowerCase().trim();
  },

  getCachedVerification(city) {
    const key = this.getCacheKey(city);
    const cached = this.verificationCache.get(key);

    if (cached) {
      const cacheDuration = cached.cacheDuration || this.CACHE_DURATION_MS;
      if ((Date.now() - cached.timestamp) < cacheDuration) {
        return cached;
      }
    }

    return null;
  },

  setCachedVerification(city, verificationData, customDuration = null) {
    const key = this.getCacheKey(city);
    this.verificationCache.set(key, {
      ...verificationData,
      timestamp: Date.now(),
      cacheDuration: customDuration || this.CACHE_DURATION_MS
    });
    this.saveCache();
  },

  async verifyClocks(clockElements, sourceInfo = null) {
    const orderedClocks = this.orderClocksSmartly(clockElements, sourceInfo);

    for (const clockEl of orderedClocks) {
      const city = clockEl.dataset.city;
      const timeText = clockEl.querySelector('.time-digital')?.textContent;

      if (!city || !timeText) continue;

      const cacheKey = sourceInfo ? `${city}_from_${sourceInfo.city}_${sourceInfo.time}` : city;

      // Check cache first
      const cached = this.getCachedVerification(cacheKey);
      if (cached) {
        this.updateClockVerificationStatus(clockEl, cached);
        if (cached.correction_needed) {
          this.applyTimeCorrection(clockEl, cached);
        }
        continue;
      }

      if (this.pendingVerifications.has(cacheKey)) {
        continue;
      }

      this.pendingVerifications.add(cacheKey);
      this.updateClockVerificationStatus(clockEl, { status: 'pending' });

      await this.verifySingleCityWithRetries(clockEl, sourceInfo);

      this.pendingVerifications.delete(cacheKey);
      await this.delay(200);
    }
  },

  async verifySingleCityWithRetries(clockEl, sourceInfo) {
    const city = clockEl.dataset.city;
    const timeText = clockEl.querySelector('.time-digital')?.textContent;

    try {
      this.updateClockVerificationStatus(clockEl, { status: 'verifying' });

      // Use client-side TimeVerificationService
      const results = await TimeVerificationService.verifyTimeConversions(
        sourceInfo || { city: city, time: timeText },
        [{ city: city, time: timeText }]
      );

      const result = results[0];

      // If result is an error due to API unavailability, remove status silently
      if (result.status === 'error' &&
          (result.message?.includes('Unable to fetch') ||
           result.message?.includes('API request failed'))) {
        this.removeVerificationStatus(clockEl);
        return;
      }

      this.updateClockVerificationStatus(clockEl, result);

      if (result.correction_needed) {
        this.applyTimeCorrection(clockEl, result);
      }

      if (result.status !== 'error') {
        const cacheKey = sourceInfo ?
          `${city}_from_${sourceInfo.city}_${sourceInfo.time}` :
          city;
        this.setCachedVerification(cacheKey, result);
      }

    } catch (error) {
      // Check if this is a CORS error
      if (error.name === 'TypeError' && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
        // CORS error - remove verification status silently
        console.log(`⚠️ Verification unavailable for ${city} (CORS restriction)`);
        this.removeVerificationStatus(clockEl);
      } else {
        console.log(`Verification failed for ${city}:`, error);
        this.updateClockVerificationStatus(clockEl, {
          status: 'error',
          message: 'Unable to verify'
        });
      }
    }
  },

  orderClocksSmartly(clockElements, sourceInfo) {
    const clocks = Array.from(clockElements);

    const clocksWithOffset = clocks.map(clock => ({
      element: clock,
      city: clock.dataset.city,
      offset: this.extractOffset(clock),
      isSource: sourceInfo &&
               clock.dataset.city &&
               clock.dataset.city.toLowerCase() === sourceInfo.city.toLowerCase()
    }));

    return clocksWithOffset
      .sort((a, b) => {
        if (a.isSource) return -1;
        if (b.isSource) return 1;
        return a.offset - b.offset;
      })
      .map(item => item.element);
  },

  extractOffset(clockEl) {
    const offsetText = clockEl.querySelector('.timezone-info')?.textContent || '';
    const match = offsetText.match(/([+-])(\d{2}):(\d{2})/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2]);
      const minutes = parseInt(match[3]);
      return sign * (hours + minutes/60);
    }
    return 0;
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  updateClockVerificationStatus(clockEl, verification) {
    let statusEl = clockEl.querySelector('.verification-status');

    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'verification-status';
      const cityLabel = clockEl.querySelector('.city-label');
      if (cityLabel) {
        cityLabel.insertAdjacentElement('afterend', statusEl);
      } else {
        clockEl.appendChild(statusEl);
      }
    }

    switch (verification.status) {
      case 'pending':
        statusEl.innerHTML = '<span class="status-pending">⏳ Pending...</span>';
        statusEl.className = 'verification-status pending';
        break;

      case 'verifying':
        statusEl.innerHTML = '<span class="status-pending">⏳ Verifying...</span>';
        statusEl.className = 'verification-status pending';
        break;

      case 'verified':
        statusEl.innerHTML = '<span class="status-verified">✓ Verified</span>';
        statusEl.className = 'verification-status verified';
        break;

      case 'corrected':
        statusEl.innerHTML = '<span class="status-corrected">⚡ Corrected</span>';
        statusEl.className = 'verification-status corrected';
        if (verification.difference_minutes) {
          statusEl.title = `Corrected by ${verification.difference_minutes} minute${verification.difference_minutes !== 1 ? 's' : ''}`;
        }
        break;

      case 'error':
        statusEl.innerHTML = '<span class="status-error">⚠️ Unable to verify</span>';
        statusEl.className = 'verification-status error';
        break;

      default:
        statusEl.innerHTML = '';
    }
  },

  removeVerificationStatus(clockEl) {
    const statusEl = clockEl.querySelector('.verification-status');
    if (statusEl) {
      statusEl.remove();
    }
  },

  applyTimeCorrection(clockEl, verification) {
    if (!verification.correction) return;

    const correction = verification.correction;

    const digitalTimeEl = clockEl.querySelector('.time-digital');
    if (digitalTimeEl) {
      digitalTimeEl.textContent = correction.time_string;
      digitalTimeEl.classList.add('time-corrected');
      setTimeout(() => {
        digitalTimeEl.classList.remove('time-corrected');
      }, 1000);
    }

    const hourAngle = ((correction.hours % 12) * 30 + correction.minutes * 0.5);
    const minuteAngle = correction.minutes * 6;

    if (window.AnimationsModule && window.AnimationsModule.animateClockToTime) {
      const correctedResult = {
        hour: correction.hours,
        minute: correction.minutes,
        is_pm: correction.hours >= 12,
        time: correction.time_string,
        offset: verification.utc_offset || clockEl.querySelector('.timezone-info')?.textContent
      };

      window.AnimationsModule.animateClockToTime(clockEl, correctedResult);
    } else {
      const hourHand = clockEl.querySelector('.hour-hand-group');
      const minuteHand = clockEl.querySelector('.minute-hand-group');

      if (hourHand) {
        hourHand.setAttribute('transform', `rotate(${hourAngle} 75 75)`);
      }
      if (minuteHand) {
        minuteHand.setAttribute('transform', `rotate(${minuteAngle} 75 75)`);
      }
    }
  },

  verifyNewClocks(container, queryInfo = null) {
    const clockElements = container.querySelectorAll('.clock-wrapper:not(.slide-out)');

    clockElements.forEach(clockEl => {
      if (!clockEl.dataset.city) {
        const cityName = clockEl.querySelector('.city-name')?.textContent;
        if (cityName) {
          clockEl.dataset.city = cityName.trim();
        }
      }

      this.updateClockVerificationStatus(clockEl, { status: 'pending' });
    });

    let sourceInfo = null;
    if (queryInfo) {
      sourceInfo = queryInfo;
    } else {
      const firstClock = clockElements[0];
      if (firstClock) {
        const sourceCity = firstClock.dataset.city || firstClock.querySelector('.city-name')?.textContent?.trim();
        const sourceTime = firstClock.querySelector('.time-digital')?.textContent;
        if (sourceCity && sourceTime) {
          sourceInfo = { city: sourceCity, time: sourceTime };
        }
      }
    }

    setTimeout(() => {
      this.verifyClocks(clockElements, sourceInfo);
    }, 500);
  },

  clearCityCache(city) {
    const key = this.getCacheKey(city);
    this.verificationCache.delete(key);
    this.saveCache();
  },

  clearAllCache() {
    this.verificationCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
};
