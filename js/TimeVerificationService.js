// TimeVerificationService - Verify time conversions using WorldTimeAPI
// Port of Rails time_verification_service.rb to pure JavaScript

import { CITY_TIMEZONE_MAP, TIMEZONE_ABBREVIATIONS } from './data/cityTimezoneMap.js';

export class TimeVerificationService {
  // Use PHP proxy to avoid CORS issues
  // Automatically detects environment and adjusts path
  static WORLDTIME_API_BASE = (() => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // If running on localhost or the root path
    if (hostname === 'localhost' || pathname === '/' || pathname === '/index.html') {
      return '/api/worldtime.php';
    }

    // If in a subdirectory like /time/, extract the base path
    const basePath = pathname.split('/').filter(p => p)[0];
    return basePath ? `/${basePath}/api/worldtime.php` : '/api/worldtime.php';
  })();

  static VERIFICATION_THRESHOLD_MINUTES = 2;
  static API_DELAY_SECONDS = 1.0;
  static MAX_REQUESTS_PER_MINUTE = 30;

  /**
   * Get WorldTimeAPI timezone for a city
   * @param {string} cityName - City name
   * @returns {string|null} - IANA timezone
   */
  static getWorldTimeTimezone(cityName) {
    const normalized = cityName.toLowerCase().trim();

    // If it's already a timezone path
    if (normalized.includes('/')) {
      return normalized;
    }

    // Check city mapping
    if (CITY_TIMEZONE_MAP[normalized]) {
      return CITY_TIMEZONE_MAP[normalized];
    }

    // Check timezone abbreviations
    if (TIMEZONE_ABBREVIATIONS[normalized]) {
      return TIMEZONE_ABBREVIATIONS[normalized];
    }

    return null;
  }

  /**
   * Verify time conversions from source to targets
   * @param {Object} sourceInfo - { city, time }
   * @param {Array} targetCities - [{ city, time }, ...]
   * @returns {Promise<Array>} - Verification results
   */
  static async verifyTimeConversions(sourceInfo, targetCities) {
    const sourceCity = sourceInfo.city || sourceInfo['city'];
    const sourceTimeStr = sourceInfo.time || sourceInfo['time'];

    console.log('='.repeat(60));
    console.log('VERIFICATION REQUEST:');
    console.log(`Source: ${sourceCity} at ${sourceTimeStr}`);
    console.log(`Targets: ${targetCities.map(c => c.city || c['city']).join(', ')}`);
    console.log('='.repeat(60));

    // Get source timezone
    const sourceTimezone = this.getWorldTimeTimezone(sourceCity);
    console.log(`Source timezone resolved: ${sourceTimezone || 'NOT FOUND'}`);

    if (!sourceTimezone) {
      console.error(`ERROR: Source city '${sourceCity}' not found in timezone database`);
      return targetCities.map(cityData => ({
        status: 'error',
        message: 'Source city not found',
        city: cityData.city || cityData['city']
      }));
    }

    try {
      // Fetch source timezone data
      console.log(`Fetching source timezone data: ${sourceTimezone}`);
      const sourceApiData = await this.fetchWorldTime(sourceTimezone);

      // Add delay after source fetch
      console.log(`Waiting ${this.API_DELAY_SECONDS}s after source fetch...`);
      await this.sleep(this.API_DELAY_SECONDS * 1000);

      if (!sourceApiData) {
        return targetCities.map(cityData => ({
          status: 'error',
          message: 'Unable to fetch source timezone data',
          city: cityData.city || cityData['city']
        }));
      }

      // Parse source time
      const [hour, minute, meridiem] = this.parseTimeString(sourceTimeStr);

      // Create source time in UTC
      const sourceDateTime = new Date(sourceApiData.datetime);
      let sourceHour24 = hour;
      if (meridiem === 'PM' && hour !== 12) {
        sourceHour24 = hour + 12;
      } else if (meridiem === 'AM' && hour === 12) {
        sourceHour24 = 0;
      }

      const sourceTime = new Date(
        sourceDateTime.getFullYear(),
        sourceDateTime.getMonth(),
        sourceDateTime.getDate(),
        sourceHour24,
        minute,
        0
      );

      // Get UTC offset for source
      const sourceOffsetSeconds = this.parseOffsetToSeconds(sourceApiData.utc_offset);
      const sourceUtc = new Date(sourceTime.getTime() - sourceOffsetSeconds * 1000);

      const results = [];

      // Check if source city is in the list
      const sourceInList = targetCities.some(c =>
        (c.city || c['city']).toLowerCase().trim() === sourceCity.toLowerCase().trim()
      );

      if (sourceInList) {
        results.push({
          city: sourceCity,
          timezone: sourceTimezone,
          calculated_time: sourceTimeStr,
          expected_time: sourceTimeStr,
          utc_offset: sourceApiData.utc_offset,
          is_dst: sourceApiData.dst,
          source_city: sourceCity,
          source_time: sourceTimeStr,
          status: 'verified',
          correction_needed: false
        });
      }

      // Verify each target city
      for (let i = 0; i < targetCities.length; i++) {
        const cityData = targetCities[i];
        const targetCity = cityData.city || cityData['city'];
        const calculatedTimeStr = cityData.time || cityData['time'];

        // Skip source city if already added
        if (targetCity.toLowerCase().trim() === sourceCity.toLowerCase().trim()) {
          continue;
        }

        // Add delay between API calls (except first)
        if (i > 0 && results.length > 0) {
          console.log(`Waiting ${this.API_DELAY_SECONDS}s before next API call...`);
          await this.sleep(this.API_DELAY_SECONDS * 1000);
        }

        console.log('-'.repeat(40));
        console.log(`Verifying: ${targetCity}`);

        const targetTimezone = this.getWorldTimeTimezone(targetCity);
        console.log(`Target timezone: ${targetTimezone || 'NOT FOUND'}`);

        if (targetTimezone) {
          const targetApiData = await this.fetchWorldTime(targetTimezone);

          if (targetApiData) {
            console.log(`✓ API response received for ${targetCity}`);

            // Calculate expected time in target timezone
            const targetOffsetSeconds = this.parseOffsetToSeconds(targetApiData.utc_offset);
            const expectedTime = new Date(sourceUtc.getTime() + targetOffsetSeconds * 1000);

            // Parse calculated time
            const [calcHour, calcMinute, calcMeridiem] = this.parseTimeString(calculatedTimeStr);
            let calcHour24 = calcHour;
            if (calcMeridiem === 'PM' && calcHour !== 12) {
              calcHour24 = calcHour + 12;
            } else if (calcMeridiem === 'AM' && calcHour === 12) {
              calcHour24 = 0;
            }

            // Compare
            const expectedHour = expectedTime.getHours();
            const expectedMinute = expectedTime.getMinutes();

            let diffMinutes = Math.abs(
              (expectedHour * 60 + expectedMinute) -
              (calcHour24 * 60 + calcMinute)
            );

            // Handle day boundary
            if (diffMinutes > 720) {
              diffMinutes = 1440 - diffMinutes;
            }

            const result = {
              city: targetCity,
              timezone: targetTimezone,
              calculated_time: calculatedTimeStr,
              expected_time: this.formatTime(expectedTime),
              utc_offset: targetApiData.utc_offset,
              is_dst: targetApiData.dst,
              source_city: sourceCity,
              source_time: sourceTimeStr,
              connection_attempts: targetApiData.connection_attempts || 1
            };

            if (diffMinutes <= this.VERIFICATION_THRESHOLD_MINUTES) {
              result.status = 'verified';
              result.correction_needed = false;
            } else {
              result.status = 'corrected';
              result.correction_needed = true;
              result.correction = {
                hours: expectedHour,
                minutes: expectedMinute,
                time_string: this.formatTime(expectedTime)
              };
              result.difference_minutes = diffMinutes;
            }

            results.push(result);
          } else {
            console.error(`✗ Failed to fetch data for ${targetCity} (${targetTimezone})`);
            results.push({
              status: 'error',
              message: 'Unable to fetch target timezone data',
              city: targetCity,
              timezone_attempted: targetTimezone,
              reason: 'API request failed or timed out'
            });
          }
        } else {
          console.error(`✗ City '${targetCity}' not found in timezone database`);
          results.push({
            status: 'error',
            message: 'Target city not found',
            city: targetCity,
            reason: 'City not in timezone mapping'
          });
        }
      }

      // Log summary
      console.log('='.repeat(60));
      console.log('VERIFICATION SUMMARY:');
      const successCount = results.filter(r => r.status === 'verified').length;
      const correctedCount = results.filter(r => r.status === 'corrected').length;
      const errorCount = results.filter(r => r.status === 'error').length;

      console.log(`✓ Verified: ${successCount}`);
      console.log(`⚡ Corrected: ${correctedCount}`);
      console.log(`✗ Errors: ${errorCount}`);

      if (errorCount > 0) {
        console.warn(`Failed cities: ${results.filter(r => r.status === 'error').map(r => r.city).join(', ')}`);
      }
      console.log('='.repeat(60));

      return results;
    } catch (error) {
      console.error('TimeVerificationService conversion error:', error);
      return targetCities.map(cityData => ({
        status: 'error',
        message: error.message,
        city: cityData.city || cityData['city']
      }));
    }
  }

  /**
   * Fetch time data from WorldTimeAPI
   * @param {string} timezone - IANA timezone
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<Object|null>} - API response data
   */
  static async fetchWorldTime(timezone, retryCount = 0) {
    const maxRetries = 2;
    const uri = `${this.WORLDTIME_API_BASE}?timezone=${encodeURIComponent(timezone)}`;
    console.log(`API Request: GET ${uri} (attempt ${retryCount + 1}/${maxRetries + 1})`);

    try {
      const startTime = Date.now();
      let attempts = 0;
      const maxAttempts = 3;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        attempts = attempt + 1;
        console.log(`Fetching WorldTimeAPI data for: ${timezone}... (attempt ${attempts}/${maxAttempts})`);

        if (attempt > 0) {
          console.log('Waiting 3 seconds before retry...');
          await this.sleep(3000);
        }

        try {
          const response = await fetch(uri, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'TimeConverter/1.0'
            }
          });

          const elapsed = Date.now() - startTime;

          if (response.ok) {
            const data = await response.json();

            // Log rate limit info if available
            const rateLimit = response.headers.get('x-ratelimit-limit');
            const rateRemaining = response.headers.get('x-ratelimit-remaining');

            if (rateLimit && rateRemaining) {
              console.log(`✓ API Success (${elapsed}ms): ${timezone} => UTC${data.utc_offset}, DST: ${data.dst} | Rate: ${rateRemaining}/${rateLimit}`);

              if (parseInt(rateRemaining) < 5) {
                console.warn(`⚠️ API Rate Limit Warning: Only ${rateRemaining} requests remaining!`);
              }
            } else {
              console.log(`✓ API Success (${elapsed}ms): ${timezone} => UTC${data.utc_offset}, DST: ${data.dst}`);
            }

            // Add attempts info
            data.connection_attempts = attempts;
            return data;
          } else {
            console.error(`✗ API Error ${response.status} for ${timezone}`);

            // Retry on server errors
            if (response.status >= 500 && retryCount < maxRetries) {
              console.warn(`Retrying after ${response.status} error...`);
              await this.sleep(500 * (retryCount + 1));
              return this.fetchWorldTime(timezone, retryCount + 1);
            }

            if (attempt === maxAttempts - 1) {
              return null;
            }
          }
        } catch (fetchError) {
          // Check if this is a CORS error
          if (fetchError.name === 'TypeError' && fetchError.message.includes('Failed to fetch')) {
            // CORS error - fail silently on first attempt to avoid console spam
            if (attempt === 0) {
              console.log('⚠️ Verification unavailable (CORS restriction). Time conversions will work without verification.');
              return null; // Don't retry on CORS errors
            }
          }

          console.warn(`✗ Connection attempt ${attempts}/${maxAttempts} failed: ${fetchError.message}`);

          if (attempt === maxAttempts - 1) {
            // Last attempt failed
            if (retryCount < maxRetries) {
              console.warn(`Retrying after network error (attempt ${retryCount + 2}/${maxRetries + 1})...`);
              await this.sleep(1000 * (retryCount + 1));
              return this.fetchWorldTime(timezone, retryCount + 1);
            }
            return null;
          }
        }
      }

      return null;
    } catch (error) {
      console.error(`✗ API General Error for ${timezone}:`, error);
      return null;
    }
  }

  /**
   * Parse time string like "03:45 PM"
   * @param {string} timeStr - Time string
   * @returns {Array} - [hour, minute, meridiem]
   */
  static parseTimeString(timeStr) {
    const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return [0, 0, 'AM'];

    const hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const meridiem = match[3].toUpperCase();

    return [hour, minute, meridiem];
  }

  /**
   * Parse offset string to seconds
   * @param {string} offsetStr - e.g., "+05:30" or "-07:00"
   * @returns {number} - Offset in seconds
   */
  static parseOffsetToSeconds(offsetStr) {
    if (!offsetStr) return 0;

    const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = parseInt(match[3]);

    return sign * (hours * 3600 + minutes * 60);
  }

  /**
   * Format time for display
   * @param {Date} date - Date object
   * @returns {string} - Formatted time
   */
  static formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12;

    const minutesStr = String(minutes).padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  }

  /**
   * Sleep utility
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
