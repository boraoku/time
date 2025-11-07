// TimeParser - Natural language time zone conversion
// Port of Rails time_parser.rb to pure JavaScript

import { CITY_TIMEZONE_MAP, TIMEZONE_ABBREVIATIONS, CITY_COUNTRY_DISAMBIGUATION } from './data/cityTimezoneMap.js';

export class TimeParser {
  constructor() {
    this.cityTimezoneMap = CITY_TIMEZONE_MAP;
    this.timezoneAbbreviations = TIMEZONE_ABBREVIATIONS;
    this.cityCountryDisambiguation = CITY_COUNTRY_DISAMBIGUATION;
  }

  /**
   * Parse natural language input
   * @param {string} input - e.g., "3:30pm new york in tokyo, paris"
   * @returns {Object|null} - { sourceTime, sourceCity, targetCities }
   */
  parse(input) {
    if (!input || input.trim() === '') {
      return null;
    }

    input = input.toLowerCase().trim();

    // Split by " in " to get source and targets
    const parts = input.split(/\s+in\s+/);
    if (parts.length !== 2) {
      return null;
    }

    const sourcePart = parts[0];
    const targetPart = parts[1];

    const [sourceTime, sourceCity] = this.parseSource(sourcePart);
    if (!sourceTime || !sourceCity) {
      return null;
    }

    const targetCities = this.parseTargets(targetPart);
    if (targetCities.length === 0) {
      return null;
    }

    return {
      sourceTime,
      sourceCity,
      targetCities
    };
  }

  /**
   * Parse source part (time + city)
   * @param {string} sourcePart - e.g., "3:30pm new york" or "noon london"
   * @returns {Array} - [Date, cityName]
   */
  parseSource(sourcePart) {
    let part = sourcePart;

    // Handle special time words
    if (part.includes('noon')) {
      part = part.replace('noon', '12pm');
    } else if (part.includes('midnight')) {
      part = part.replace('midnight', '12am');
    }

    // Match time pattern: 3:30pm, 3pm, 3:30 PM, etc.
    const timeMatch = part.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)?/i);
    if (!timeMatch) {
      return [null, null];
    }

    let hour = parseInt(timeMatch[1]);
    const minute = parseInt(timeMatch[2] || '0');
    const meridiem = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

    // Convert to 24-hour format
    if (meridiem === 'pm' && hour !== 12) {
      hour += 12;
    } else if (meridiem === 'am' && hour === 12) {
      hour = 0;
    }

    // Extract city name (everything after the time)
    let cityPart = part.replace(timeMatch[0], '').trim();

    if (cityPart === '') {
      cityPart = 'utc';
    }

    // Get the timezone for the source city
    const sourceTimezone = this.getTimezone(cityPart);
    if (!sourceTimezone) {
      console.error(`Unknown timezone for city: ${cityPart}`);
      return [null, null];
    }

    // Create a Date representing the specified time IN THE SOURCE TIMEZONE
    // This is the critical fix!
    const sourceTime = this.createDateInTimezone(hour, minute, sourceTimezone);

    return [sourceTime, cityPart];
  }

  /**
   * Create a Date object representing a specific time in a specific timezone
   * @param {number} hour - Hour (0-23)
   * @param {number} minute - Minute (0-59)
   * @param {string} timezone - IANA timezone
   * @returns {Date} - Date object in UTC representing that local time
   */
  createDateInTimezone(hour, minute, timezone) {
    // Get current date in the target timezone
    const now = new Date();
    const dateInTZ = now.toLocaleString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZoneName: 'longOffset'
    });

    // Extract date parts and offset
    const parts = dateInTZ.split(', ');
    const [month, day, year] = parts[0].split('/');

    // Extract timezone offset (e.g., "GMT-5" or "GMT+5:30")
    const offsetMatch = dateInTZ.match(/GMT([+-])(\d{1,2}):?(\d{2})?/);
    let offsetHours = 0;

    if (offsetMatch) {
      const sign = offsetMatch[1] === '+' ? 1 : -1;
      const hours = parseInt(offsetMatch[2]);
      const minutes = parseInt(offsetMatch[3] || '0');
      offsetHours = sign * (hours + minutes / 60);
    }

    // Calculate UTC hour
    // If it's 3:30 PM in New York (UTC-5), that's 8:30 PM UTC
    let utcHour = hour - offsetHours;
    let utcMinute = minute;
    let utcDay = parseInt(day);
    let utcMonth = parseInt(month) - 1;
    let utcYear = parseInt(year);

    // Handle day boundary crossing
    if (utcHour >= 24 || utcHour < 0) {
      const dayOffset = Math.floor(utcHour / 24);
      utcDay += dayOffset;
      utcHour = utcHour - (dayOffset * 24);

      // Adjust month/year if needed
      const tempDate = new Date(Date.UTC(utcYear, utcMonth, utcDay));
      utcYear = tempDate.getUTCFullYear();
      utcMonth = tempDate.getUTCMonth();
      utcDay = tempDate.getUTCDate();
    }

    // Ensure hour is in 0-23 range
    utcHour = ((utcHour % 24) + 24) % 24;

    // Create Date in UTC
    return new Date(Date.UTC(utcYear, utcMonth, utcDay, utcHour, utcMinute, 0, 0));
  }

  /**
   * Parse target cities (comma or "and" separated)
   * @param {string} targetPart - e.g., "tokyo, paris and london"
   * @returns {Array<string>} - ['tokyo', 'paris', 'london']
   */
  parseTargets(targetPart) {
    const cities = [];

    // Split by comma, "and", or "&"
    const separators = /,|\s+and\s+|\s+&\s+/;
    const parts = targetPart.split(separators);

    for (const part of parts) {
      const city = part.trim().toLowerCase();
      if (city !== '') {
        cities.push(city);
      }
    }

    return cities;
  }

  /**
   * Convert time across timezones
   * @param {Object} parsed - Output from parse()
   * @returns {Array<Object>} - Array of time results
   */
  convertTime(parsed) {
    if (!parsed) {
      return null;
    }

    const { sourceTime, sourceCity, targetCities } = parsed;

    // Get source timezone
    const sourceTimezone = this.getTimezone(sourceCity);
    if (!sourceTimezone) {
      return null;
    }

    // Include source city in results
    const allCities = [sourceCity, ...targetCities];
    const uniqueCities = [...new Set(allCities)]; // Remove duplicates

    const results = [];

    for (const city of uniqueCities) {
      const timezone = this.getTimezone(city);
      if (!timezone) {
        continue;
      }

      try {
        // Convert time to target timezone using Intl API
        const convertedTime = this.convertToTimezone(sourceTime, sourceTimezone, timezone);

        if (convertedTime) {
          // Format city name properly
          const formattedCity = this.formatCityName(city);

          // Get timezone offset
          const offset = this.getTimezoneOffset(timezone, convertedTime);

          // Determine if PM
          const hour = convertedTime.getHours();
          const isPM = hour >= 12;

          results.push({
            city: formattedCity,
            time: this.formatTime(convertedTime),
            timezone: timezone,
            offset: offset,
            isPM: isPM,
            hour: hour,
            minute: convertedTime.getMinutes()
          });
        }
      } catch (error) {
        console.error(`Error converting time for ${city}:`, error);
        continue;
      }
    }

    // Sort by UTC offset
    return results.sort((a, b) => {
      const offsetA = this.parseOffsetToMinutes(a.offset);
      const offsetB = this.parseOffsetToMinutes(b.offset);
      return offsetA - offsetB;
    });
  }

  /**
   * Convert time from source timezone to target timezone
   * @param {Date} time - Source time (this should be a UTC Date created correctly)
   * @param {string} sourceTimezone - Source IANA timezone (not used in new approach)
   * @param {string} targetTimezone - Target IANA timezone
   * @returns {Date} - Converted time
   */
  convertToTimezone(time, sourceTimezone, targetTimezone) {
    try {
      // The input 'time' is already a proper UTC Date
      // We just need to format it in the target timezone
      const targetString = time.toLocaleString('en-US', {
        timeZone: targetTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });

      // Parse the target string to create Date object
      const [datePart, timePart] = targetString.split(', ');
      const [month, day, year] = datePart.split('/');
      const [hour, minute, second] = timePart.split(':');

      return new Date(year, month - 1, day, hour, minute, second);
    } catch (error) {
      console.error('Error in convertToTimezone:', error);
      return null;
    }
  }

  /**
   * Get timezone for a city or timezone abbreviation
   * @param {string} cityOrTz - City name or timezone abbreviation
   * @returns {string|null} - IANA timezone identifier
   */
  getTimezone(cityOrTz) {
    const normalized = cityOrTz.toLowerCase().trim();

    // Check for country disambiguation first
    if (this.cityCountryDisambiguation[normalized]) {
      return this.cityCountryDisambiguation[normalized];
    }

    // Check timezone abbreviations
    if (this.timezoneAbbreviations[normalized]) {
      return this.timezoneAbbreviations[normalized];
    }

    // Check city mapping
    if (this.cityTimezoneMap[normalized]) {
      return this.cityTimezoneMap[normalized];
    }

    // Handle UTC specially
    if (normalized === 'utc') {
      return 'UTC';
    }

    // Try capitalizing each word as last resort
    const capitalized = normalized
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');

    return this.cityTimezoneMap[capitalized] || null;
  }

  /**
   * Get timezone offset string (e.g., "+05:30", "-08:00")
   * @param {string} timezone - IANA timezone
   * @param {Date} date - Date to get offset for (handles DST)
   * @returns {string} - Offset string
   */
  getTimezoneOffset(timezone, date) {
    try {
      const dateString = date.toLocaleString('en-US', {
        timeZone: timezone,
        timeZoneName: 'longOffset'
      });

      // Extract offset from string like "1/1/2024, 12:00:00 AM GMT+05:30"
      const match = dateString.match(/GMT([+-]\d{1,2}):?(\d{2})?/);
      if (match) {
        const hours = match[1];
        const minutes = match[2] || '00';
        return `${hours}:${minutes}`;
      }

      // Fallback: calculate offset manually
      const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
      const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
      const offsetMs = tzDate - utcDate;
      const offsetHours = Math.floor(Math.abs(offsetMs) / (1000 * 60 * 60));
      const offsetMinutes = Math.floor((Math.abs(offsetMs) % (1000 * 60 * 60)) / (1000 * 60));
      const sign = offsetMs >= 0 ? '+' : '-';

      return `${sign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
    } catch (error) {
      console.error('Error getting timezone offset:', error);
      return '+00:00';
    }
  }

  /**
   * Format city name for display
   * @param {string} city - City name
   * @returns {string} - Formatted city name
   */
  formatCityName(city) {
    // Handle parentheses for country disambiguation
    if (city.includes('(')) {
      const parts = city.split(' (');
      const cityPart = parts[0].split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
      const countryPart = parts[1] ? parts[1].replace(')', '').split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ') : '';
      return countryPart ? `${cityPart} (${countryPart})` : cityPart;
    }

    // Regular capitalization
    return city.split(' ').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Format time for display
   * @param {Date} date - Date object
   * @returns {string} - Formatted time (e.g., "3:30 PM")
   */
  formatTime(date) {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';

    hours = hours % 12;
    hours = hours ? hours : 12; // 0 becomes 12

    const minutesStr = String(minutes).padStart(2, '0');
    return `${hours}:${minutesStr} ${ampm}`;
  }

  /**
   * Parse offset string to minutes
   * @param {string} offset - e.g., "+05:30" or "-08:00"
   * @returns {number} - Offset in minutes
   */
  parseOffsetToMinutes(offset) {
    if (!offset) return 0;

    const match = offset.match(/([+-])(\d{1,2}):(\d{2})/);
    if (!match) return 0;

    const sign = match[1] === '+' ? 1 : -1;
    const hours = parseInt(match[2]);
    const minutes = parseInt(match[3]);

    return sign * (hours * 60 + minutes);
  }
}
