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
    // Clean up expired cache entries every minute for short-lived error caches
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
    }, 60 * 1000); // Every minute (more frequent to clean up short-lived error caches)
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
    // Smart ordering: source first, then west to east
    const orderedClocks = this.orderClocksSmartly(clockElements, sourceInfo);

    // Process each city sequentially
    for (const clockEl of orderedClocks) {
      const city = clockEl.dataset.city;
      const timeText = clockEl.querySelector('.time-digital')?.textContent;

      if (!city || !timeText) continue;

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
        continue;
      }

      // Skip if already being verified
      if (this.pendingVerifications.has(cacheKey)) {
        continue;
      }

      // Mark as pending
      this.pendingVerifications.add(cacheKey);

      // Show "Pending..." initially
      this.updateClockVerificationStatus(clockEl, { status: 'pending' });

      // Verify this single city with live retry updates
      await this.verifySingleCityWithRetries(clockEl, sourceInfo);

      // Remove from pending
      this.pendingVerifications.delete(cacheKey);

      // Small delay between cities for visual clarity (200ms)
      await this.delay(200);
    }
  },

  async verifySingleCityWithRetries(clockEl, sourceInfo) {
    const city = clockEl.dataset.city;
    const timeText = clockEl.querySelector('.time-digital')?.textContent;

    try {
      // Show "Verifying..." status
      this.updateClockVerificationStatus(clockEl, {
        status: 'verifying'
      });

      // Make single city verification request
      const result = await this.performSingleCityVerification({
        city: city,
        time: timeText,
        source: sourceInfo
      });

      // Update UI with result
      this.updateClockVerificationStatus(clockEl, result);

      // Apply correction if needed
      if (result.correction_needed) {
        this.applyTimeCorrection(clockEl, result);
      }

      // Cache successful result only
      if (result.status !== 'error') {
        const cacheKey = sourceInfo ?
          `${city}_from_${sourceInfo.city}_${sourceInfo.time}` :
          city;
        this.setCachedVerification(cacheKey, result);
      }

    } catch (error) {
      console.log(`Verification failed for ${city}:`, error);
      // Show error status
      this.updateClockVerificationStatus(clockEl, {
        status: 'error',
        message: 'Unable to verify'
      });
    }
  },

  orderClocksSmartly(clockElements, sourceInfo) {
    const clocks = Array.from(clockElements);

    // Extract timezone offset from each clock
    const clocksWithOffset = clocks.map(clock => ({
      element: clock,
      city: clock.dataset.city,
      offset: this.extractOffset(clock),
      isSource: sourceInfo &&
               clock.dataset.city &&
               clock.dataset.city.toLowerCase() === sourceInfo.city.toLowerCase()
    }));

    // Sort: source first, then by offset (west to east)
    return clocksWithOffset
      .sort((a, b) => {
        if (a.isSource) return -1;  // Source always first
        if (b.isSource) return 1;
        return a.offset - b.offset; // West (negative) to East (positive)
      })
      .map(item => item.element);
  },

  extractOffset(clockEl) {
    // Get from timezone-info element like "UTC-08:00" or "UTC+09:00"
    const offsetText = clockEl.querySelector('.timezone-info')?.textContent || '';
    const match = offsetText.match(/UTC([+-])(\d{2}):(\d{2})/);
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

  async performSingleCityVerification(data) {
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;

    const response = await fetch('/time_converter/verify_single', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Single city verification failed: ${response.statusText}`);
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

    // Set city data attributes and show initial pending status
    clockElements.forEach(clockEl => {
      if (!clockEl.dataset.city) {
        const cityName = clockEl.querySelector('.city-name')?.textContent;
        if (cityName) {
          clockEl.dataset.city = cityName.trim();
        }
      }

      // Show "Pending" status immediately for all clocks
      this.updateClockVerificationStatus(clockEl, { status: 'pending' });
    });

    // Extract source information if available
    let sourceInfo = null;
    if (queryInfo) {
      sourceInfo = queryInfo;
    } else {
      // Try to determine source from the first clock (which is usually the source city)
      const firstClock = clockElements[0];
      if (firstClock) {
        const sourceCity = firstClock.dataset.city || firstClock.querySelector('.city-name')?.textContent?.trim();
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