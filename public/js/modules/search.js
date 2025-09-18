// Search module
export const SearchModule = {
  init(clockRenderer, animationsModule, verificationModule) {
    this.clockRenderer = clockRenderer;
    this.animationsModule = animationsModule;
    this.verificationModule = verificationModule;
    
    this.queryInput = document.querySelector('input[name="query"]');
    this.form = document.querySelector('form');
    
    this.setupEventListeners();
    
    // Check if there's a query in the URL on page load
    const urlParams = new URLSearchParams(window.location.search);
    const urlQuery = urlParams.get('query');
    if (urlQuery) {
      // Perform search will handle decoding and updating the input field
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
    const exampleText = document.querySelector('.example-text');
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
    
    // Don't decode if it's already in normal format (contains : and spaces)
    // Only decode if it appears to be in custom URL format
    let decodedQuery = query;
    if (query.includes('_') || query.includes('~') || query.includes('--') || (query.includes('-'))) {
      // Decode in specific order to handle -- before -
      decodedQuery = query
        .replace(/~/g, ', ')           // ~ back to comma-space for cities
        .replace(/--/g, ' in ')        // -- back to " in "
        .replace(/-/g, ' ')            // - back to space
        .replace(/_/g, ':');           // _ back to :
    }
    
    // Update input field with decoded query
    if (this.queryInput && this.queryInput.value !== decodedQuery) {
      this.queryInput.value = decodedQuery;
    }
    
    // Make AJAX request with decoded query
    fetch(`/?query=${encodeURIComponent(decodedQuery)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => this.handleSearchResponse(data, decodedQuery))
    .catch(error => this.handleSearchError(error));
  },

  handleEmptyQuery(exampleText) {
    // Clear all clocks with slide-out animation
    const clocksContainer = document.querySelector('.clocks-container');
    if (clocksContainer) {
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
          .replace(/:/g, '_')  // : becomes _
          .replace(/,\s*/g, '~')  // comma (with optional spaces) becomes ~ (tilde)
          .replace(/\s+and\s+/gi, '~')  // "and" (case insensitive) becomes ~ (tilde)
          .replace(/\s+in\s+/gi, '--')  // " in " becomes -- (double hyphen)
          .replace(/\s+/g, '-');  // spaces become - (single hyphen)
        window.history.pushState({}, '', `/?query=${urlQuery}`);
      }
    } catch (error) {
      console.error('Error handling search response:', error);
      this.handleSearchError(error);
    }
  },

  handleSearchError(error) {
    console.error('Search error:', error);
    console.error('Stack trace:', error.stack);
    this.showError('Failed to process request');
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
      let clocksContainer = document.querySelector('.clocks-container');

      if (!clocksContainer) {
        // First time or after clearing - create container
        clocksContainer = document.createElement('div');
        clocksContainer.className = 'clocks-container';
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

      // Trigger verification after clocks are displayed with source info
      if (this.verificationModule) {
        this.verificationModule.verifyNewClocks(clocksContainer, sourceInfo);
      }
    } catch (error) {
      console.error('Error displaying results:', error);
      throw error;
    }
  }
};