// Clock rendering module
export const ClockRenderer = {
  createClockHTML(result, animationClass = '') {
    const hourAngle = ((result.hour % 12) * 30 + result.minute * 0.5) - 90;
    const minuteAngle = result.minute * 6 - 90;
    const isPm = result.is_pm;
    
    return `
      <div class="clock-wrapper ${animationClass}" data-city="${result.city.toLowerCase()}">
        <div class="analog-clock">
          <svg class="clock-face ${isPm ? 'pm' : 'am'}" viewBox="0 0 150 150">
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            <circle cx="75" cy="75" r="73" fill="none" />
            
            ${this.renderHourMarkers(isPm)}
            ${this.renderClockHands(hourAngle, minuteAngle, isPm)}
            
            <circle cx="75" cy="75" r="5" fill="#88ff00" filter="url(#glow)" />
            
            ${this.renderClockNumbers(isPm)}
          </svg>
        </div>
        
        <div class="city-name">${result.city}</div>
        <div class="time-digital">${result.time}</div>
        <div class="timezone-info">${result.offset}</div>
      </div>
    `;
  },

  renderHourMarkers(isPm) {
    return Array.from({length: 12}, (_, i) => {
      const angle = i * 30;
      const x1 = 75 + 60 * Math.sin(angle * Math.PI / 180);
      const y1 = 75 - 60 * Math.cos(angle * Math.PI / 180);
      const x2 = 75 + 65 * Math.sin(angle * Math.PI / 180);
      const y2 = 75 - 65 * Math.cos(angle * Math.PI / 180);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" 
            stroke="${isPm ? '#66ff00' : '#00ff66'}" 
            stroke-width="${i % 3 === 0 ? '3' : '1'}"
            opacity="${i % 3 === 0 ? '1' : '0.5'}"
            filter="url(#glow)" />`;
    }).join('');
  },

  renderClockHands(hourAngle, minuteAngle, isPm) {
    const hourX = 75 + 35 * Math.cos(hourAngle * Math.PI / 180);
    const hourY = 75 + 35 * Math.sin(hourAngle * Math.PI / 180);
    const minuteX = 75 + 50 * Math.cos(minuteAngle * Math.PI / 180);
    const minuteY = 75 + 50 * Math.sin(minuteAngle * Math.PI / 180);
    
    return `
      <!-- Hour hand -->
      <line class="hour-hand-line clock-hand-transition" x1="75" y1="75" 
            x2="${hourX}" y2="${hourY}"
            stroke="${isPm ? '#66ff00' : '#00ff66'}" 
            stroke-width="8"
            stroke-linecap="round"
            data-angle="${hourAngle}" />
      <line class="hour-hand-line-inner clock-hand-transition" x1="75" y1="75" 
            x2="${hourX}" y2="${hourY}"
            stroke="${isPm ? '#004400' : '#003333'}" 
            stroke-width="5"
            stroke-linecap="round" />
      
      <!-- Minute hand -->
      <line class="minute-hand-line clock-hand-transition" x1="75" y1="75" 
            x2="${minuteX}" y2="${minuteY}"
            stroke="${isPm ? '#66ff00' : '#00ff66'}" 
            stroke-width="8"
            stroke-linecap="round"
            data-angle="${minuteAngle}" />
      <line class="minute-hand-line-inner clock-hand-transition" x1="75" y1="75" 
            x2="${minuteX}" y2="${minuteY}"
            stroke="${isPm ? '#004400' : '#003333'}" 
            stroke-width="5"
            stroke-linecap="round" />
    `;
  },

  renderClockNumbers(isPm) {
    const color = isPm ? '#66ff00' : '#00ff66';
    return `
      <text x="75" y="20" text-anchor="middle" 
            fill="${color}" 
            font-size="12" font-weight="bold" font-family="Orbitron">XII</text>
      <text x="130" y="78" text-anchor="middle" 
            fill="${color}" 
            font-size="12" font-weight="bold" font-family="Orbitron">III</text>
      <text x="75" y="135" text-anchor="middle" 
            fill="${color}" 
            font-size="12" font-weight="bold" font-family="Orbitron">VI</text>
      <text x="20" y="78" text-anchor="middle" 
            fill="${color}" 
            font-size="12" font-weight="bold" font-family="Orbitron">IX</text>
    `;
  },

  updateClockHands(clockElement, result) {
    const hourAngle = ((result.hour % 12) * 30 + result.minute * 0.5) - 90;
    const minuteAngle = result.minute * 6 - 90;
    const isPm = result.is_pm;
    
    // Update hour hands
    const hourHands = clockElement.querySelectorAll('.hour-hand-line, .hour-hand-line-inner');
    hourHands.forEach(hand => {
      hand.setAttribute('x2', 75 + 35 * Math.cos(hourAngle * Math.PI / 180));
      hand.setAttribute('y2', 75 + 35 * Math.sin(hourAngle * Math.PI / 180));
    });
    
    // Update minute hands
    const minuteHands = clockElement.querySelectorAll('.minute-hand-line, .minute-hand-line-inner');
    minuteHands.forEach(hand => {
      hand.setAttribute('x2', 75 + 50 * Math.cos(minuteAngle * Math.PI / 180));
      hand.setAttribute('y2', 75 + 50 * Math.sin(minuteAngle * Math.PI / 180));
    });
    
    // Update clock face color
    const clockFace = clockElement.querySelector('.clock-face');
    clockFace.setAttribute('class', `clock-face ${isPm ? 'pm' : 'am'}`);
    
    // Update digital time
    clockElement.querySelector('.time-digital').textContent = result.time;
    clockElement.querySelector('.timezone-info').textContent = result.offset;
  }
};