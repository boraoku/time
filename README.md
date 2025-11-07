# 🕐 TiME - Pure Client-Side Edition

**Zero dependencies. Zero build tools. Just pure JavaScript.**

This is a 100% client-side version of the TiME time zone converter. No Node.js, no npm, no bundlers - just upload and go!

## ✨ Features

- 🎯 **Natural Language Input** - "3:30pm new york in tokyo, paris"
- 🕐 **Analog Clock Visualization** - Beautiful SVG clocks with AM/PM color coding
- 🌍 **1200+ Cities Supported** - Comprehensive global coverage
- 🏙️ **City Disambiguation** - "san jose (usa)" vs "san jose (costa rica)"
- ✅ **Real-Time Verification** - WorldTimeAPI integration
- 🎨 **Retro 80s Aesthetic** - Neon green glow, scanlines, synthwave vibes
- 📱 **Fully Responsive** - Mobile, tablet, desktop
- 🚀 **Zero Dependencies** - Pure ES6 modules, no frameworks

## 📁 Project Structure

```
time-ts/
├── index.html                    # Main HTML with inline CSS
├── js/
│   ├── main.js                   # Entry point, module initialization
│   ├── TimeParser.js             # Natural language parsing logic
│   ├── TimeVerificationService.js # WorldTimeAPI integration
│   ├── data/
│   │   └── cityTimezoneMap.js    # 1200+ city-timezone mappings
│   └── modules/
│       ├── quotes.js             # Rotating header quotes
│       ├── clock_renderer.js     # SVG analog clock rendering
│       ├── animations.js         # Clock animations
│       ├── SearchModule.js       # Search & time conversion
│       └── VerificationModule.js # Time verification UI
└── README.md
```

## 🚀 Quick Start

### Option 1: Python HTTP Server

```bash
cd time-ts
python3 -m http.server 3003
# Open http://localhost:3003
```

### Option 2: PHP Built-in Server

```bash
cd time-ts
php -S localhost:3003
# Open http://localhost:3003
```

### Option 3: Node.js (if you have it)

```bash
cd time-ts
npx serve -p 3003
# Open http://localhost:3003
```

### Option 4: Any Static File Server

Just serve the `time-ts` folder from any web server!

## 🌐 Deployment

### GitHub Pages

1. Create a new repo
2. Upload `time-ts` folder contents to root
3. Enable Pages in Settings → Pages → Deploy from main branch

### Netlify

1. Drag & drop the `time-ts` folder to Netlify
2. Done! Your site is live

### Vercel

```bash
cd time-ts
vercel deploy --prod
```

### Traditional Hosting

Upload files via FTP/SFTP to any web host. Works on Apache, Nginx, any server.

## 💻 How It Works

### Pure ES6 Modules

The app uses native browser ES6 modules (`type="module"`). No transpilation needed!

```javascript
import { TimeParser } from './TimeParser.js';
import { QuotesModule } from './modules/quotes.js';
```

### Native Browser APIs

- **Intl.DateTimeFormat** - Timezone conversions
- **Fetch API** - WorldTimeAPI calls
- **LocalStorage** - Verification caching
- **History API** - URL management
- **Native Date** - All time operations

### No Build Step Required

Just edit files and refresh! The browser handles:
- ES6 module loading
- Timezone calculations
- CORS (WorldTimeAPI supports it)
- Caching

## 📚 Architecture

### TimeParser.js

Parses natural language queries:
- Regex-based parsing
- Timezone abbreviation expansion
- City disambiguation
- Native Intl API for conversions

### TimeVerificationService.js

Verifies times against WorldTimeAPI:
- Retry logic with exponential backoff
- Rate limiting (30 req/min)
- Error handling
- Connection resilience

### Modules

- **QuotesModule** - Rotating Doc Brown quotes
- **ClockRenderer** - SVG clock generation
- **AnimationsModule** - Clock hand animations, slide in/out
- **SearchModule** - Form handling, URL encoding
- **VerificationModule** - Verification UI, caching

## 🎨 Styling

All CSS is inline in `index.html`:
- Orbitron font (Google Fonts)
- Neon green color palette
- Scanline overlay effects
- Grid floor with perspective
- Smooth animations
- Responsive breakpoints

## 🔧 Browser Compatibility

Requires modern browsers with:
- ES6 modules support
- Fetch API
- Intl.DateTimeFormat with timezone support
- LocalStorage
- CSS animations

**Supported:**
- Chrome 61+
- Firefox 60+
- Safari 11+
- Edge 79+

**Not supported:**
- Internet Explorer (by design)

## 📝 Usage Examples

```
"3:30pm new york in tokyo, paris"
"noon PST in EST and GMT"
"9am london in sydney and singapore"
"midnight utc in jst, ist and cet"
"10am san jose (usa) in london"
```

### URL Scheme

Custom encoding for clean, shareable URLs:

```
"3:30pm new york in tokyo, paris"
→ /?query=3_30pm-new-york--tokyo~paris

Rules:
: → _    (colons to underscores)
in → --  (in to double hyphen)
, → ~    (comma to tilde)
space → - (space to single hyphen)
```

## 🌍 Supported Locations

1200+ cities across:
- **Oceania & Pacific** - 20+ cities
- **East Asia** - 25+ cities
- **Southeast Asia** - 15+ cities
- **South Asia** - 20+ cities
- **Middle East** - 25+ cities
- **Africa** - 30+ cities
- **Europe** - 200+ cities
- **North America** - 500+ cities
- **Central & South America** - 100+ cities
- **Caribbean** - 30+ cities

Plus timezone abbreviations: PST, EST, GMT, JST, IST, CET, AEST, etc.

## 🔒 Security & Privacy

- **No server-side code** - Everything runs in browser
- **No data collection** - Zero tracking or analytics
- **LocalStorage only** - Caching stays on your device
- **HTTPS ready** - Works on secure connections
- **CORS friendly** - WorldTimeAPI supports CORS

## ⚡ Performance

- **~50-70 KB total** (gzipped)
- **Instant parsing** - No server round trips
- **Cached verifications** - 24-hour cache
- **Lazy verification** - Sequential with delays
- **Efficient rendering** - RequestAnimationFrame for animations

## 🐛 Debugging

Open browser DevTools Console to see:
```
🕐 TiME - Initializing client-side time converter...
✓ Quotes module initialized
✓ Verification module initialized
✓ Search module initialized
🚀 TiME is ready! Synch your watches!
```

## 🎯 Differences from Rails Version

| Feature | Rails Version | Client-Side Version |
|---------|--------------|---------------------|
| **Backend** | Ruby/Rails | None |
| **Parsing** | Server-side | Browser (TimeParser.js) |
| **Verification** | Server API | Direct WorldTimeAPI |
| **Deployment** | Heroku/VPS | Any static host |
| **Dependencies** | Gemfile | None |
| **Build** | Asset pipeline | None |
| **Speed** | Network latency | Instant parsing |

## 🚀 Development Workflow

1. Edit any `.js` or `.html` file
2. Refresh browser
3. See changes immediately
4. No build, no compile, no wait!

## 📦 File Sizes

```
index.html                  ~30 KB
TimeParser.js               ~10 KB
TimeVerificationService.js  ~8 KB
cityTimezoneMap.js          ~40 KB (1200+ cities!)
modules/*.js                ~15 KB total
────────────────────────────────
Total:                      ~103 KB
Gzipped:                    ~50 KB
```

## 🎓 Learning Resources

This project is great for learning:
- ES6 modules in practice
- Native browser APIs
- Timezone handling with Intl
- SVG animations
- CSS-only effects
- Client-side architecture

## 🤝 Contributing

Since this is zero-dependency:
1. Fork the repo
2. Edit files directly
3. Test in browser
4. Submit PR

No setup, no npm install, no problems!

## 📄 License

MIT License - Same as the original Rails version

## 🙏 Acknowledgments

- Port of the Rails TiME app by @boraoku
- WorldTimeAPI for verification
- Orbitron font by Google Fonts
- Inspired by 1980s synthwave aesthetic

---

## 🎯 Quick Reference

### Start Development Server
```bash
python3 -m http.server 3003
```

### Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
# Enable Pages in repo settings
```

### Test Example Queries
```
http://localhost:3003/?query=3_30pm-new-york--tokyo~paris
http://localhost:3003/?query=noon-pst--est~gmt
http://localhost:3003/?query=9am-london--sydney~singapore
```

---

<div align="center">

**Built with ♡ and Pure JavaScript**

**No dependencies. No build tools. Just works.**

</div>
