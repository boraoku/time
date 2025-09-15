// Doc Brown quotes module
export const QuotesModule = {
  quotes: [
    "Not an hour sooner, not an hour later.",
    "Gonna build a time machine? Do it with some style!",
    "If my calculations are correct...",
    "Great Scott!",
    "Roads? Where we're going, we don't need roads.",
    "That's what Doc says!",
    "Your future is whatever you make it.",
    "Time circuits on. Flux capacitor... fluxing."
  ],

  currentQuoteIndex: 0,
  subtitle: null,

  init() {
    this.subtitle = document.getElementById('subtitle');
    if (!this.subtitle) return;

    // Start from a random index
    this.currentQuoteIndex = Math.floor(Math.random() * this.quotes.length);
    
    // Set initial random quote immediately
    this.subtitle.textContent = this.quotes[this.currentQuoteIndex];
    
    // Add transition for smooth fade
    this.subtitle.style.transition = 'opacity 0.3s ease';
    
    // Start rotation
    this.startRotation();
  },

  startRotation() {
    setInterval(() => {
      this.currentQuoteIndex = (this.currentQuoteIndex + 1) % this.quotes.length;
      this.subtitle.style.opacity = '0';
      
      setTimeout(() => {
        this.subtitle.textContent = this.quotes[this.currentQuoteIndex];
        this.subtitle.style.opacity = '0.8';
      }, 300);
    }, 3000);
  }
};