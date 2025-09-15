// Animations module
export const AnimationsModule = {
  currentCities: new Map(),
  isFirstQuery: true,

  addInitialClocks(container, results, clockRenderer) {
    const clocksHTML = results.map((result, index) => {
      const animClass = this.isFirstQuery ? 'initial-appear' : 'slide-in';
      const delay = index * 0.1;
      return clockRenderer.createClockHTML(result, animClass)
        .replace('clock-wrapper', 
          `clock-wrapper" style="animation-delay: ${delay}s, ${0.8 + delay}s`);
    }).join('');
    
    container.innerHTML = clocksHTML;
    
    // Update cities map
    results.forEach(result => {
      this.currentCities.set(result.city.toLowerCase(), result);
    });
    
    this.isFirstQuery = false;
  },

  updateExistingClocks(container, results, clockRenderer) {
    const newCities = new Map();
    results.forEach(result => {
      newCities.set(result.city.toLowerCase(), result);
    });
    
    const existingClocks = container.querySelectorAll('.clock-wrapper');
    const processedCities = new Set();
    
    // Update or remove existing clocks
    existingClocks.forEach(clock => {
      const cityName = clock.dataset.city;
      
      if (newCities.has(cityName)) {
        // City still exists - update clock hands
        clock.classList.remove('initial-appear', 'slide-in', 'slide-out');
        clock.classList.add('existing');
        clockRenderer.updateClockHands(clock, newCities.get(cityName));
        processedCities.add(cityName);
      } else {
        // City removed - slide out
        clock.classList.add('slide-out');
        setTimeout(() => clock.remove(), 500);
      }
    });
    
    // Add new cities
    let newClocksHTML = '';
    let newClockIndex = 0;
    newCities.forEach((result, cityName) => {
      if (!processedCities.has(cityName)) {
        const delay = newClockIndex * 0.1;
        newClocksHTML += clockRenderer.createClockHTML(result, 'slide-in')
          .replace('clock-wrapper', 
            `clock-wrapper" style="animation-delay: ${delay}s, ${0.6 + delay}s`);
        newClockIndex++;
      }
    });
    
    if (newClocksHTML) {
      container.insertAdjacentHTML('beforeend', newClocksHTML);
    }
    
    // Reorder clocks after animations
    this.reorderClocks(container, results);
    
    this.currentCities = newCities;
  },

  reorderClocks(container, results) {
    setTimeout(() => {
      const allClocks = Array.from(container.querySelectorAll('.clock-wrapper:not(.slide-out)'));
      const orderedClocks = [];
      
      results.forEach(result => {
        const clock = allClocks.find(c => c.dataset.city === result.city.toLowerCase());
        if (clock) {
          orderedClocks.push(clock);
        }
      });
      
      // Clear and re-append in correct order
      orderedClocks.forEach(clock => {
        clock.classList.add('reordering');
        container.appendChild(clock);
      });
    }, 100);
  },

  clearClocks(container) {
    const clocks = container.querySelectorAll('.clock-wrapper');
    clocks.forEach((clock, index) => {
      setTimeout(() => {
        clock.classList.add('slide-out');
      }, index * 50);
    });
    
    setTimeout(() => {
      container.remove();
      this.currentCities.clear();
      this.isFirstQuery = true;
    }, 600);
  }
};