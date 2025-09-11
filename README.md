# 🕐 Let's Sync Our Times? 🌍

<div align="center">

```
╔════════════════════════════════════════════════════════════════════════════╗
║                                                                            ║
║   ▄▄▄█████▓ ██▓ ███▄ ▄███▓▓█████      ██████ ▓██   ██▓ ███▄    █  ▄████▄   ║
║   ▓  ██▒ ▓▒▓██▒▓██▒▀█▀ ██▒▓█   ▀    ▒██    ▒  ▒██  ██▒ ██ ▀█   █ ▒██▀ ▀█   ║
║   ▒ ▓██░ ▒░▒██▒▓██    ▓██░▒███      ░ ▓██▄     ▒██ ██░▓██  ▀█ ██▒▒▓█    ▄  ║
║   ░ ▓██▓ ░ ░██░▒██    ▒██ ▒▓█  ▄      ▒   ██▒  ░ ▐██▓░▓██▒  ▐▌██▒▒▓▓▄ ▄██▒ ║
║     ▒██▒ ░ ░██░▒██▒   ░██▒░▒████▒   ▒██████▒▒  ░ ██▒▓░▒██░   ▓██░▒ ▓███▀ ░ ║
║     ▒ ░░   ░▓  ░ ▒░   ░  ░░░ ▒░ ░   ▒ ▒▓▒ ▒ ░   ██▒▒▒ ░ ▒░   ▒ ▒ ░ ░▒ ▒  ░ ║
║       ░     ▒ ░░  ░      ░ ░ ░  ░   ░ ░▒  ░ ░ ▓██ ░▒░ ░ ░░   ░ ▒░  ░  ▒    ║
║     ░       ▒ ░░      ░      ░      ░  ░  ░   ▒ ▒ ░░     ░   ░ ░ ░         ║
║             ░         ░      ░  ░         ░   ░ ░              ░ ░ ░       ║
║                                                ░ ░                  ░      ║
║                                                                            ║
║                                                                            ║
║                       xXx What time is it there? xXx                       ║ 
╚════════════════════════════════════════════════════════════════════════════╝
```

[![Ruby](https://img.shields.io/badge/Ruby-3.4.5-00ff66?style=for-the-badge&logo=ruby&logoColor=white)](https://www.ruby-lang.org/)
[![Rails](https://img.shields.io/badge/Rails-8.0-66ff00?style=for-the-badge&logo=rubyonrails&logoColor=white)](https://rubyonrails.org/)
[![License](https://img.shields.io/badge/License-MIT-88ff00?style=for-the-badge)](LICENSE)

</div>

## 🌟 About

A radical retro-styled time zone converter that transforms boring time calculations into a visual synthwave experience. Convert times across multiple cities with analog clocks that adapt their glow based on AM/PM - all wrapped in that sweet 80s aesthetic.

<div align="center">
  <img src="app_v0.1.gif" alt="Time Sync App Demo" width="100%" style="border-radius: 10px; box-shadow: 0 0 30px rgba(0, 255, 100, 0.5);">
</div>

## ✨ Features

- 🎯 **Natural Language Input** - Just type like you speak: "3:30pm new york in tokyo, paris"
- 🕐 **Analog Clock Visualization** - Beautiful SVG clocks with AM/PM color coding
- 🌍 **60+ Cities Supported** - Major cities worldwide with automatic timezone detection
- 📱 **Fully Responsive** - Looks rad on mobile, tablet, and desktop
- 🎨 **Retro 80s Aesthetic** - Neon green glow, scanlines, and synthwave vibes
- ⚡ **Zero External Dependencies** - Pure Rails, no JavaScript frameworks needed
- 🚀 **Instant Conversion** - Just press Enter, no buttons needed

## 🛠️ Tech Stack

```
╔════════════════════════════════════════╗
║   BUILT WITH PURE RAILS POWER          ║
╠════════════════════════════════════════╣
║ • Ruby on Rails 8.0                    ║
║ • Pure CSS (No frameworks!)            ║
║ • Vanilla JavaScript                   ║
║ • SVG Analog Clocks                    ║
║ • ActiveSupport TimeZone               ║
╚════════════════════════════════════════╝
```

## 🚀 Quick Start

### Prerequisites

- Ruby 3.4.5 or higher
- Rails 8.0 or higher
- Bundler

### Installation

```bash
# Clone the repository
git clone https://github.com/boraoku/time.git
cd time

# Install dependencies
bundle install

# Create and migrate database
rails db:create
rails db:migrate

# Start the server
rails server
```

Visit `http://localhost:3000` and start syncing times!

## 💚 Usage Examples

```
Input Examples:
═══════════════════════════════════════════════════
→ "10pm sydney in london and dubai"
→ "3:30pm new york in tokyo, paris"  
→ "noon PST in EST and GMT"
→ "midnight london in sydney, LA, moscow"
→ "9:45 PM EST in London, Dubai, Singapore, Tokyo"
═══════════════════════════════════════════════════
```

## 🎨 Design Philosophy

This app embraces the radical aesthetic of the 1980s:

- **Neon Green Color Palette** - Because the future was green in the 80s
- **Analog Clocks** - Digital is cool, but analog is forever
- **Scanline Effects** - That authentic CRT monitor feel
- **Grid Floor Pattern** - Straight from TRON
- **Orbitron Font** - Futuristic yet nostalgic

## 🗺️ Supported Locations

<details>
<summary>Click to see all 60+ supported cities</summary>

### Americas
- New York, Los Angeles, Chicago, San Francisco
- Toronto, Vancouver, Montreal
- Mexico City, São Paulo, Buenos Aires

### Europe  
- London, Paris, Berlin, Madrid, Rome
- Amsterdam, Brussels, Vienna, Zurich
- Moscow, Istanbul, Athens

### Asia Pacific
- Tokyo, Seoul, Beijing, Shanghai, Hong Kong
- Singapore, Bangkok, Jakarta
- Sydney, Melbourne, Auckland

### Middle East & Africa
- Dubai, Abu Dhabi, Cairo
- Johannesburg, Cape Town

</details>

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the radical aesthetic of the 1980s
- Built with love for the retro-future we were promised
- Special thanks to all timezone API maintainers

---

<div align="center">

```
╔═══════════════════════════════════════╗
║         Made with ♡ and Rails         ║
║         Let's sync our times!         ║
╚═══════════════════════════════════════╝
```

**[⬆ back to top](#-lets-sync-our-times-)**

</div>