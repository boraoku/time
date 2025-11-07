// Animations module
export const AnimationsModule = {
  currentCities: new Map(),
  isFirstQuery: true,

  addInitialClocks(container, results, clockRenderer) {
    const clocksHTML = results.map((result, index) => {
      const animClass = this.isFirstQuery ? 'initial-appear' : 'slide-in';
      const delay = index * 0.1;
      // Start from 12 o'clock for initial render
      const startFrom12 = true; // Always start from 12 for initial clocks
      return clockRenderer.createClockHTML(result, animClass, startFrom12)
        .replace('clock-wrapper',
          `clock-wrapper" style="animation-delay: ${delay}s, ${1.3 + delay}s`);
    }).join('');
    
    container.innerHTML = clocksHTML;
    
    // Trigger initial animation after elements are in DOM
    requestAnimationFrame(() => {
      results.forEach((result, index) => {
        const clockWrapper = container.children[index];
        if (clockWrapper) {
          const hourHand = clockWrapper.querySelector('.hour-hand-group');
          const minuteHand = clockWrapper.querySelector('.minute-hand-group');
          
          if (hourHand && hourHand.dataset.initial === 'true') {
            // Make sure CSS variables are set
            const hourAngle = hourHand.dataset.angle;
            hourHand.style.setProperty('--hour-angle', `${hourAngle}deg`);
            hourHand.classList.add('animate-initial');

            // Set final transform after animation completes
            setTimeout(() => {
              hourHand.setAttribute('transform', `rotate(${hourAngle} 75 75)`);
            }, 1200);
          }

          if (minuteHand && minuteHand.dataset.initial === 'true') {
            // Make sure CSS variables are set
            const minuteAngle = minuteHand.dataset.angle;
            minuteHand.style.setProperty('--minute-angle', `${minuteAngle}deg`);
            minuteHand.classList.add('animate-initial');

            // Set final transform after animation completes
            setTimeout(() => {
              minuteHand.setAttribute('transform', `rotate(${minuteAngle} 75 75)`);
            }, 1200);
          }

          // Ensure float animation starts after hands finish animating
          if (hourHand?.dataset.initial === 'true' || minuteHand?.dataset.initial === 'true') {
            setTimeout(() => {
              // Remove initial animation classes and ensure float animation is running
              clockWrapper.classList.remove('initial-appear', 'slide-in');
              clockWrapper.classList.add('existing');
            }, 1300);
          }
        }
      });
    });
    
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
        // City still exists - animate clock hands to new time
        clock.classList.remove('initial-appear', 'slide-in', 'slide-out');
        clock.classList.add('existing');
        this.animateClockToTime(clock, newCities.get(cityName));
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
    const newClockElements = [];
    newCities.forEach((result, cityName) => {
      if (!processedCities.has(cityName)) {
        const delay = newClockIndex * 0.1;
        newClocksHTML += clockRenderer.createClockHTML(result, 'slide-in', true)
          .replace('clock-wrapper',
            `clock-wrapper" style="animation-delay: ${delay}s, ${1.3 + delay}s`);
        newClockElements.push(result);
        newClockIndex++;
      }
    });
    
    if (newClocksHTML) {
      const beforeCount = container.children.length;
      container.insertAdjacentHTML('beforeend', newClocksHTML);
      
      // Trigger initial animation for new clocks
      requestAnimationFrame(() => {
        for (let i = 0; i < newClockElements.length; i++) {
          const clockWrapper = container.children[beforeCount + i];
          if (clockWrapper) {
            const hourHand = clockWrapper.querySelector('.hour-hand-group');
            const minuteHand = clockWrapper.querySelector('.minute-hand-group');
            
            if (hourHand && hourHand.dataset.initial === 'true') {
              const hourAngle = hourHand.dataset.angle;
              hourHand.style.setProperty('--hour-angle', `${hourAngle}deg`);
              hourHand.classList.add('animate-initial');

              setTimeout(() => {
                hourHand.setAttribute('transform', `rotate(${hourAngle} 75 75)`);
              }, 1200);
            }

            if (minuteHand && minuteHand.dataset.initial === 'true') {
              const minuteAngle = minuteHand.dataset.angle;
              minuteHand.style.setProperty('--minute-angle', `${minuteAngle}deg`);
              minuteHand.classList.add('animate-initial');

              setTimeout(() => {
                minuteHand.setAttribute('transform', `rotate(${minuteAngle} 75 75)`);
              }, 1200);
            }

            // Ensure float animation starts after hands finish animating
            if (hourHand?.dataset.initial === 'true' || minuteHand?.dataset.initial === 'true') {
              setTimeout(() => {
                // Remove initial animation classes and ensure float animation is running
                clockWrapper.classList.remove('initial-appear', 'slide-in');
                clockWrapper.classList.add('existing');
              }, 1300);
            }
          }
        }
      });
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
  },

  animateClockToTime(clockElement, result) {
    // No need to add 90 degrees - hands point up by default (0 = 12 o'clock)
    const hourAngle = ((result.hour % 12) * 30 + result.minute * 0.5);
    const minuteAngle = result.minute * 6;
    const isPm = result.is_pm;

    // Pause the bouncing animation while hands are animating
    clockElement.classList.add('hands-animating');
    
    // Update hour hand with animation
    const hourHandGroup = clockElement.querySelector('.hour-hand-group');
    if (hourHandGroup) {
      // Store current angle as 'from' angle
      const currentHourAngle = hourHandGroup.dataset.angle || '0';
      hourHandGroup.style.setProperty('--hour-angle-from', `${currentHourAngle}deg`);
      hourHandGroup.style.setProperty('--hour-angle', `${hourAngle}deg`);
      hourHandGroup.dataset.angle = hourAngle;
      
      // Remove any existing animation classes and add update animation
      hourHandGroup.classList.remove('animate-initial', 'animate-update');
      void hourHandGroup.offsetWidth; // Force reflow
      hourHandGroup.classList.add('animate-update');
      
      // Update colors
      const hourLine = hourHandGroup.querySelector('.hour-hand-line');
      const hourInner = hourHandGroup.querySelector('.hour-hand-line-inner');
      if (hourLine) hourLine.setAttribute('stroke', isPm ? '#00ff66' : '#66ff00');
      if (hourInner) hourInner.setAttribute('stroke', isPm ? '#003333' : '#004400');
      
      // Update transform after animation completes
      setTimeout(() => {
        hourHandGroup.setAttribute('transform', `rotate(${hourAngle} 75 75)`);
      }, 800);
    }

    // Update minute hand with animation
    const minuteHandGroup = clockElement.querySelector('.minute-hand-group');
    if (minuteHandGroup) {
      // Store current angle as 'from' angle
      const currentMinuteAngle = minuteHandGroup.dataset.angle || '0';
      minuteHandGroup.style.setProperty('--minute-angle-from', `${currentMinuteAngle}deg`);
      minuteHandGroup.style.setProperty('--minute-angle', `${minuteAngle}deg`);
      minuteHandGroup.dataset.angle = minuteAngle;

      // Remove any existing animation classes and add update animation
      minuteHandGroup.classList.remove('animate-initial', 'animate-update');
      void minuteHandGroup.offsetWidth; // Force reflow
      minuteHandGroup.classList.add('animate-update');

      // Update colors
      const minuteLine = minuteHandGroup.querySelector('.minute-hand-line');
      const minuteInner = minuteHandGroup.querySelector('.minute-hand-line-inner');
      if (minuteLine) minuteLine.setAttribute('stroke', isPm ? '#00ff66' : '#66ff00');
      if (minuteInner) minuteInner.setAttribute('stroke', isPm ? '#003333' : '#004400');

      // Update transform after animation completes
      setTimeout(() => {
        minuteHandGroup.setAttribute('transform', `rotate(${minuteAngle} 75 75)`);
      }, 800);
    }

    // Resume bouncing animation after hands finish animating
    setTimeout(() => {
      clockElement.classList.remove('hands-animating');
    }, 850);
    
    // Update clock face color
    const clockFace = clockElement.querySelector('.clock-face');
    clockFace.setAttribute('class', `clock-face ${isPm ? 'pm' : 'am'}`);
    
    // Update all hour markers colors (exclude hands)
    const hourMarkers = clockElement.querySelectorAll('line[stroke]');
    hourMarkers.forEach(marker => {
      if (!marker.classList.contains('hour-hand-line') && 
          !marker.classList.contains('hour-hand-line-inner') &&
          !marker.classList.contains('minute-hand-line') &&
          !marker.classList.contains('minute-hand-line-inner')) {
        marker.setAttribute('stroke', isPm ? '#00ff66' : '#66ff00');
      }
    });
    
    // Update clock numbers colors
    const numbers = clockElement.querySelectorAll('text');
    numbers.forEach(num => {
      num.setAttribute('fill', isPm ? '#00ff66' : '#66ff00');
    });
    
    // Update digital time display
    clockElement.querySelector('.time-digital').textContent = result.time;
    clockElement.querySelector('.timezone-info').textContent = result.offset;
  }
};