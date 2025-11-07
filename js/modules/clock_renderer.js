// Clock rendering module
export const ClockRenderer = {
  createClockHTML(result, animationClass = '', startFrom12 = false) {
    // Clock hands point up (12 o'clock) by default, so no need to subtract 90
    const hourAngle = ((result.hour % 12) * 30 + result.minute * 0.5);
    const minuteAngle = result.minute * 6;
    const isPm = result.isPM || result.is_pm; // Support both camelCase and snake_case

    return `
      <div class="clock-wrapper ${animationClass}" data-city="${result.city.toLowerCase()}">
        <div class="analog-clock">
          <svg class="clock-face ${isPm ? 'pm' : 'am'}" viewBox="0 0 150 150">
            <defs>
              <radialGradient id="gradient-${isPm ? 'pm' : 'am'}-${result.city.replace(/\s+/g, '-')}" cx="50%" cy="50%" r="70%" fx="50%" fy="50%">
                <stop offset="0%" style="stop-color:#00ff66;stop-opacity:1" />
                <stop offset="50%" style="stop-color:${isPm ? '#006633' : '#336600'};stop-opacity:1" />
                <stop offset="100%" style="stop-color:${isPm ? '#001100' : '#0a1a00'};stop-opacity:1" />
              </radialGradient>
              <radialGradient id="inner-glow-${result.city.replace(/\s+/g, '-')}" cx="50%" cy="50%" r="50%">
                <stop offset="0%" style="stop-color:rgba(0, 255, 100, 0.2);stop-opacity:1" />
                <stop offset="70%" style="stop-color:rgba(0, 255, 100, 0);stop-opacity:0" />
              </radialGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
              <filter id="clock-shadow-${isPm ? 'pm' : 'am'}" x="-50%" y="-50%" width="200%" height="200%">
                <!-- Outer glow -->
                <feGaussianBlur in="SourceAlpha" stdDeviation="13" result="blur1"/>
                <feFlood flood-color="rgba(0, 255, 100, 0.8)" result="color1"/>
                <feComposite in="color1" in2="blur1" operator="in" result="glow1"/>

                <!-- Inner glow effect -->
                <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur2"/>
                <feFlood flood-color="rgba(0, 255, 100, 0.3)" result="color2"/>
                <feComposite in="color2" in2="blur2" operator="in" result="innerglow"/>
                <feComposite in="innerglow" in2="SourceAlpha" operator="out" result="innerglow2"/>

                <feMerge>
                  <feMergeNode in="glow1"/>
                  <feMergeNode in="SourceGraphic"/>
                  <feMergeNode in="innerglow2"/>
                </feMerge>
              </filter>
            </defs>

            <!-- Background circle with gradient fill -->
            <circle cx="75" cy="75" r="73"
                    fill="url(#gradient-${isPm ? 'pm' : 'am'}-${result.city.replace(/\s+/g, '-')})"
                    stroke="#00ff66"
                    stroke-width="3"
                    filter="url(#clock-shadow-${isPm ? 'pm' : 'am'})" />

            <!-- Inner glow overlay for brightness -->
            <circle cx="75" cy="75" r="68"
                    fill="url(#inner-glow-${result.city.replace(/\s+/g, '-')})"
                    style="mix-blend-mode: screen; pointer-events: none;" />

            <!-- Overlay circle for proper masking -->
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