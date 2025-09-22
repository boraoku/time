// Clock rendering module
export const ClockRenderer = {
  createClockHTML(result, animationClass = '', startFrom12 = false) {
    // Clock hands point up (12 o'clock) by default, so no need to subtract 90
    const hourAngle = ((result.hour % 12) * 30 + result.minute * 0.5);
    const minuteAngle = result.minute * 6;
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
            ${this.renderClockHands(hourAngle, minuteAngle, isPm, startFrom12)}
            
            <circle cx="75" cy="75" r="5" fill="#88ff00" filter="url(#glow)" />
            
            ${this.renderClockNumbers(isPm)}
          </svg>
        </div>
        
        <div class="city-label">
          <div class="city-name">${result.city}</div>
        </div>
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
            stroke="${isPm ? '#00ff66' : '#66ff00'}" 
            stroke-width="${i % 3 === 0 ? '3' : '1'}"
            opacity="${i % 3 === 0 ? '1' : '0.5'}"
            filter="url(#glow)" />`;
    }).join('');
  },

  renderClockHands(hourAngle, minuteAngle, isPm, startFrom12 = false) {
    // If startFrom12, start at 12 o'clock (0 degrees), otherwise start at correct position
    const hourTransform = startFrom12 ? 'rotate(0 75 75)' : `rotate(${hourAngle} 75 75)`;
    const minuteTransform = startFrom12 ? 'rotate(0 75 75)' : `rotate(${minuteAngle} 75 75)`;
    
    // Don't set CSS variables if startFrom12 - let JavaScript do it for animation
    const hourStyle = `transform-origin: 75px 75px;`;
    const minuteStyle = `transform-origin: 75px 75px;`;
    
    return `
      <!-- Hour hand -->
      <g class="hour-hand-group" 
         transform="${hourTransform}"
         style="${hourStyle}"
         data-angle="${hourAngle}"
         data-initial="${startFrom12}">
        <line class="hour-hand-line" x1="75" y1="75" x2="75" y2="40"
              stroke="${isPm ? '#00ff66' : '#66ff00'}" 
              stroke-width="8"
              stroke-linecap="round" />
        <line class="hour-hand-line-inner" x1="75" y1="75" x2="75" y2="40"
              stroke="${isPm ? '#003333' : '#004400'}" 
              stroke-width="5"
              stroke-linecap="round" />
      </g>
      
      <!-- Minute hand -->
      <g class="minute-hand-group" 
         transform="${minuteTransform}"
         style="${minuteStyle}"
         data-angle="${minuteAngle}"
         data-initial="${startFrom12}">
        <line class="minute-hand-line" x1="75" y1="75" x2="75" y2="25"
              stroke="${isPm ? '#00ff66' : '#66ff00'}" 
              stroke-width="8"
              stroke-linecap="round" />
        <line class="minute-hand-line-inner" x1="75" y1="75" x2="75" y2="25"
              stroke="${isPm ? '#003333' : '#004400'}" 
              stroke-width="5"
              stroke-linecap="round" />
      </g>
    `;
  },

  renderClockNumbers(isPm) {
    const color = isPm ? '#00ff66' : '#66ff00';
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
  }
};