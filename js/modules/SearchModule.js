// Search module - Client-side version
import { TimeParser } from '../TimeParser.js';

export const SearchModule = {
  parser: null,

  init(clockRenderer, animationsModule, verificationModule) {
    this.clockRenderer = clockRenderer;
    this.animationsModule = animationsModule;
    this.verificationModule = verificationModule;
    this.parser = new TimeParser();

    this.queryInput = document.getElementById('query-input');
    this.form = document.getElementById('time-form');

    this.setupEventListeners();

    // Check if there's a query in the URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('query');
    if (urlQuery) {
      this.performSearch(urlQuery);
    }
  },

  setupEventListeners() {
    // Handle form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.performSearch(this.queryInput.value);
      });
    }

    // Handle Enter key in input
    if (this.queryInput) {
      this.queryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.performSearch(this.queryInput.value);
        }
      });
    }

    // Handle example clicks
    const exampleLinks = document.querySelectorAll('.example-link');
    exampleLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const query = link.getAttribute('data-query');
        this.queryInput.value = query;
        this.performSearch(query);
      });
    });
  },

  performSearch(query) {
    // Hide examples if shown
    const exampleText = document.getElementById('example-text');
    if (exampleText) {
      exampleText.style.display = 'none';
    }

    // Clear any existing error
    const existingError = document.querySelector('.error-message');
    if (existingError) {
      existingError.remove();
    }

    if (!query) {
      this.handleEmptyQuery(exampleText);
      return;
    }

    // Decode custom URL format if needed
    let decodedQuery = query;
    if (query.includes('_') || query.includes('~') || query.includes('--')) {
      decodedQuery = query
        .replace(/~/g, ', ')
        .replace(/--/g, ' in ')
        .replace(/-/g, ' ')
        .replace(/_/g, ':');
    }

    // Update input field with decoded query
    if (this.queryInput && this.queryInput.value !== decodedQuery) {
      this.queryInput.value = decodedQuery;
    }

    // Parse and convert using client-side TimeParser
    try {
      const parsed = this.parser.parse(decodedQuery);

      if (!parsed) {
        this.showError("Could not parse the input. Try format like: '10pm sydney in london and dubai'");
        return;
      }

      const results = this.parser.convertTime(parsed);

      if (!results || results.length === 0) {
        this.showError("Could not convert time. Please check city names.");
        return;
      }

      this.handleSearchResponse({ results }, decodedQuery);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Failed to process request');
    }
  },

  handleEmptyQuery(exampleText) {
    // Clear all clocks with slide-out animation
    const clocksContainer = document.getElementById('clocks-container');
    if (clocksContainer && clocksContainer.children.length > 0) {
      this.animationsModule.clearClocks(clocksContainer);
    }

    // Show examples again if query is empty
    if (exampleText) {
      exampleText.style.display = 'block';
    }
  },

  handleSearchResponse(data, query) {
    try {
      if (data.error) {
        this.showError(data.error);
      } else if (data.results && data.results.length > 0) {
        this.displayResults(data.results);

        // Update URL without reload - custom encoding
        const urlQuery = query
          .toLowerCase()
          .replace(/:/g, '_')
          .replace(/,\s*/g, '~')
          .replace(/\s+and\s+/gi, '~')
          .replace(/\s+in\s+/gi, '--')
          .replace(/\s+/g, '-');
        window.history.pushState({}, '', `?query=${urlQuery}`);
      }
    } catch (error) {
      console.error('Error handling search response:', error);
      this.showError('Failed to process results');
    }
  },

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = 'ERROR: ' + message;
    const inputSection = document.querySelector('.input-section');
    inputSection.insertAdjacentElement('afterend', errorDiv);
  },

  displayResults(results) {
    try {
      let clocksContainer = document.getElementById('clocks-container');

      if (!clocksContainer) {
        // First time - create container
        clocksContainer = document.createElement('div');
        clocksContainer.className = 'clocks-container';
        clocksContainer.id = 'clocks-container';
        document.querySelector('.container').appendChild(clocksContainer);

        this.animationsModule.addInitialClocks(clocksContainer, results, this.clockRenderer);
      } else {
        // Update existing container
        this.animationsModule.updateExistingClocks(clocksContainer, results, this.clockRenderer);
      }

      // Extract source info from first result (usually the source city)
      let sourceInfo = null;
      if (results && results.length > 0) {
        const firstResult = results[0];
        sourceInfo = {
          city: firstResult.city,
          time: firstResult.time
        };
      }

      // Trigger verification after clocks are displayed
      if (this.verificationModule) {
        this.verificationModule.verifyNewClocks(clocksContainer, sourceInfo);
      }
    } catch (error) {
      console.error('Error displaying results:', error);
      throw error;
    }
  }
};
