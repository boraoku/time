// Doc Brown quotes module
export const QuotesModule = {
  quotes: [
    "Not an hour sooner,\nnot an hour later.",
    "Gonna build\na time machine?\nDo it with some style!",
    "If my calculations\nare correct...",
    "Great Scott!",
    "Roads?\nWhere we're going,\nwe don't need roads.",
    "That's what\nDoc says!",
    "Your future is\nwhatever you make it.",
    "Time circuits on.\nFlux capacitor...\nFluxing."
  ],

  currentQuoteIndex: 0,
  subtitle: null,

  init() {
    this.subtitle = document.getElementById('subtitle');
    if (!this.subtitle) return;

    // Start from a random index
    this.currentQuoteIndex = Math.floor(Math.random() * this.quotes.length);
    
    // Set initial random quote immediately, converting \n to <br>
    this.subtitle.innerHTML = this.quotes[this.currentQuoteIndex].replace(/\n/g, '<br>');
    
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
        this.subtitle.innerHTML = this.quotes[this.currentQuoteIndex].replace(/\n/g, '<br>');
        this.subtitle.style.opacity = '0.8';
      }, 300);
    }, 3000);
  }
};