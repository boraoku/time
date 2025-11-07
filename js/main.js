// Main entry point for TiME - Pure client-side time zone converter
import { QuotesModule } from './modules/quotes.js';
import { ClockRenderer } from './modules/clock_renderer.js';
import { AnimationsModule } from './modules/animations.js';
import { SearchModule } from './modules/SearchModule.js';
import { VerificationModule } from './modules/VerificationModule.js';

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🕐 TiME - Initializing client-side time converter...');

  // Initialize quotes rotation
  QuotesModule.init();
  console.log('✓ Quotes module initialized');

  // Initialize verification module
  VerificationModule.init();
  console.log('✓ Verification module initialized');

  // Make AnimationsModule available globally for verification module
  window.AnimationsModule = AnimationsModule;

  // Initialize search with dependencies
  SearchModule.init(ClockRenderer, AnimationsModule, VerificationModule);
  console.log('✓ Search module initialized');

  // Check URL for initial query
  const urlParams = new URLSearchParams(window.location.search);
  const urlQuery = urlParams.get('query');
  if (urlQuery) {
    console.log(`📍 URL query detected: ${urlQuery}`);
    SearchModule.performSearch(urlQuery);
  }

  console.log('🚀 TiME is ready! Synch your watches!');
});

// Handle any global errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});
