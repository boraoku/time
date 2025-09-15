// Search module
export const SearchModule = {
  init(clockRenderer, animationsModule) {
    this.clockRenderer = clockRenderer;
    this.animationsModule = animationsModule;
    
    this.queryInput = document.querySelector('input[name="query"]');
    this.form = document.querySelector('form');
    
    this.setupEventListeners();
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
    
    // Make AJAX request
    fetch(`/?query=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    })
    .then(response => response.json())
    .then(data => this.handleSearchResponse(data, query))
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
    if (data.error) {
      this.showError(data.error);
    } else if (data.results && data.results.length > 0) {
      this.displayResults(data.results);
      // Update URL without reload
      window.history.pushState({}, '', `/?query=${encodeURIComponent(query)}`);
    }
  },

  handleSearchError(error) {
    console.error('Search error:', error);
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
  }
};