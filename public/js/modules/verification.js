// Time Verification Module
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
        // Convert back to Map and filter out expired entries
        const now = Date.now();
        Object.entries(data).forEach(([key, value]) => {
          if (value.timestamp && (now - value.timestamp) < this.CACHE_DURATION_MS) {
            this.verificationCache.set(key, value);
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
    // Clean up expired cache entries every hour
    setInterval(() => {
      const now = Date.now();
      let hasChanges = false;

      this.verificationCache.forEach((value, key) => {
        if ((now - value.timestamp) >= this.CACHE_DURATION_MS) {
          this.verificationCache.delete(key);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        this.saveCache();
      }
    }, 60 * 60 * 1000); // Every hour
  },

  getCacheKey(city) {
    return city.toLowerCase().trim();
  },

  getCachedVerification(city) {
    const key = this.getCacheKey(city);
    const cached = this.verificationCache.get(key);

    if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION_MS) {
      return cached;
    }

    return null;
  },

  setCachedVerification(city, verificationData) {
    const key = this.getCacheKey(city);
    this.verificationCache.set(key, {
      ...verificationData,
      timestamp: Date.now()
    });
    this.saveCache();
  },

  async verifyClocks(clockElements, sourceInfo = null) {
    const citiesToVerify = [];
    const clocksToUpdate = [];

    // Collect cities that need verification
    clockElements.forEach(clockEl => {
      const city = clockEl.dataset.city;
      const timeText = clockEl.querySelector('.time-digital')?.textContent;

      if (!city || !timeText) return;

      // Create cache key with source info if available
      const cacheKey = sourceInfo ? `${city}_from_${sourceInfo.city}_${sourceInfo.time}` : city;

      // Check cache first
      const cached = this.getCachedVerification(cacheKey);
      if (cached) {
        // Use cached data immediately
        this.updateClockVerificationStatus(clockEl, cached);
        if (cached.correction_needed) {
          this.applyTimeCorrection(clockEl, cached);
        }
      } else if (!this.pendingVerifications.has(cacheKey)) {
        // Add to verification queue
        citiesToVerify.push({ city, time: timeText });
        clocksToUpdate.push(clockEl);
        this.pendingVerifications.add(cacheKey);

        // Show pending status
        this.updateClockVerificationStatus(clockEl, { status: 'pending' });
      }
    });

    if (citiesToVerify.length === 0) return;

    // Perform verification
    try {
      const verificationData = {
        cities: citiesToVerify
      };

      // Add source information if available
      if (sourceInfo) {
        verificationData.source = sourceInfo;
      }

      const response = await this.performVerification(verificationData);

      if (response.verifications) {
        response.verifications.forEach((verification, index) => {
          const clockEl = clocksToUpdate[index];
          if (!clockEl) return;

          // Create cache key with source info if available
          const cacheKey = sourceInfo ?
            `${verification.city}_from_${sourceInfo.city}_${sourceInfo.time}` :
            verification.city;

          // Cache the result
          this.setCachedVerification(cacheKey, verification);

          // Update UI
          this.updateClockVerificationStatus(clockEl, verification);

          // Apply correction if needed
          if (verification.correction_needed) {
            this.applyTimeCorrection(clockEl, verification);
          }

          // Remove from pending
          this.pendingVerifications.delete(cacheKey);
        });
      }
    } catch (error) {
      console.error('Verification failed:', error);

      // Update all pending clocks with error status
      clocksToUpdate.forEach(clockEl => {
        const city = clockEl.dataset.city;
        this.updateClockVerificationStatus(clockEl, { status: 'error' });
        this.pendingVerifications.delete(city);
      });
    }
  },

  async performVerification(verificationData) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    const response = await fetch('/time_converter/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify(verificationData)
    });

    if (!response.ok) {
      throw new Error(`Verification failed: ${response.statusText}`);
    }

    return await response.json();
  },

  updateClockVerificationStatus(clockEl, verification) {
    let statusEl = clockEl.querySelector('.verification-status');

    // Create status element if it doesn't exist
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

    // Update status based on verification result
    switch (verification.status) {
      case 'pending':
        statusEl.innerHTML = '<span class="status-pending">⏳ Checking...</span>';
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

  applyTimeCorrection(clockEl, verification) {
    if (!verification.correction) return;

    const correction = verification.correction;

    // Update digital time display
    const digitalTimeEl = clockEl.querySelector('.time-digital');
    if (digitalTimeEl) {
      digitalTimeEl.textContent = correction.time_string;

      // Add a subtle flash animation to indicate correction
      digitalTimeEl.classList.add('time-corrected');
      setTimeout(() => {
        digitalTimeEl.classList.remove('time-corrected');
      }, 1000);
    }

    // Animate clock hands to corrected position
    const hourAngle = ((correction.hours % 12) * 30 + correction.minutes * 0.5);
    const minuteAngle = correction.minutes * 6;

    // Use the existing animation method from animations module
    if (window.AnimationsModule && window.AnimationsModule.animateClockToTime) {
      // Create a result object matching the expected format
      const correctedResult = {
        hour: correction.hours,
        minute: correction.minutes,
        is_pm: correction.hours >= 12,
        time: correction.time_string,
        offset: verification.utc_offset || clockEl.querySelector('.timezone-info')?.textContent
      };

      window.AnimationsModule.animateClockToTime(clockEl, correctedResult);
    } else {
      // Fallback: directly update transform if animations module not available
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

  // Called after new clocks are added to the DOM
  verifyNewClocks(container, queryInfo = null) {
    const clockElements = container.querySelectorAll('.clock-wrapper:not(.slide-out)');

    // Extract source information if available
    let sourceInfo = null;
    if (queryInfo) {
      sourceInfo = queryInfo;
    } else {
      // Try to determine source from the first clock (which is usually the source city)
      const firstClock = clockElements[0];
      if (firstClock) {
        const sourceCity = firstClock.dataset.city;
        const sourceTime = firstClock.querySelector('.time-digital')?.textContent;
        if (sourceCity && sourceTime) {
          sourceInfo = { city: sourceCity, time: sourceTime };
        }
      }
    }

    // Add a small delay to ensure animations have started
    setTimeout(() => {
      this.verifyClocks(clockElements, sourceInfo);
    }, 500);
  },

  // Clear cache for a specific city
  clearCityCache(city) {
    const key = this.getCacheKey(city);
    this.verificationCache.delete(key);
    this.saveCache();
  },

  // Clear entire cache
  clearAllCache() {
    this.verificationCache.clear();
    localStorage.removeItem(this.STORAGE_KEY);
  }
};