# ARGUS OBSIDIAN - Landing Page

A modern, privacy-focused landing page for ARGUS OBSIDIAN - "The Digital Sentinel" for AI data protection.

## Project Structure

```
ARGUS/
├── index.html              # Main HTML file
├── css/
│   └── style.css          # Custom styles and animations
├── js/
│   └── main.js            # Interactive functionality
├── config/
│   └── tailwind.config.js  # Tailwind CSS configuration
└── README.md              # This file
```

## Features

- **Modern Design**: Glassmorphism effects, gradient backgrounds, and smooth animations
- **Dark Theme**: OLED-optimized dark theme with cyberpunk aesthetic
- **Responsive**: Fully responsive design for mobile, tablet, and desktop
- **Interactive Demo**: Live data detection and masking demo in the demo section
- **Accessibility**: Semantic HTML, focus indicators, and smooth scrolling
- **Performance**: Optimized for fast loading with minimal dependencies

## Technologies Used

- **HTML5**: Semantic markup
- **Tailwind CSS**: Utility-first CSS framework (via CDN)
- **Vanilla JavaScript**: Interactive features, no dependencies
- **Google Fonts**: Manrope, Inter, and Space Grotesk typefaces
- **Material Symbols**: Icon library from Google

## Getting Started

### Option 1: Open in Browser
Simply open `index.html` in your browser. All dependencies are loaded from CDN.

### Option 2: Local Development Server
```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx http-server
```

Then visit `http://localhost:8000` in your browser.

## File Breakdown

### index.html
- Clean, semantic HTML structure
- Divided into logical sections with IDs for navigation
- All interactive elements have IDs for JavaScript targeting
- Links to external CSS and JS files

### css/style.css
- Custom styles for glass-card effect
- Glow effects for primary colors
- Hero gradient background
- Scrollbar styling
- Responsive design utilities
- Animation keyframes

### js/main.js
- Real-time sensitive data detection
- Demo interaction handling
- Smooth scroll navigation
- Risk level calculation
- Mock pattern matching for PII/sensitive data

### config/tailwind.config.js
- Extended color palette for ARGUS Obsidian branding
- Custom font families (headline, body, label)
- Border radius customization
- Dark mode configuration

## Sections

1. **Navigation Bar**: Fixed header with logo and navigation links
2. **Hero Section**: Large headline with CTA buttons
3. **Features Section**: Three-column feature grid (Detect, Mask, Restore)
4. **Demo Section**: Interactive demo showing data protection features
5. **Trust & Future Section**: Key metrics and value propositions
6. **CTA Section**: Final call-to-action
7. **Footer**: Links and copyright information

## Customization

### Colors
Edit the Tailwind config in `config/tailwind.config.js` to change the color scheme.

### Typography
Font families are defined in the Tailwind config. Update Google Fonts link in `index.html` to change fonts.

### Content
Edit the text content directly in `index.html`. All section content is well-commented.

### Interactive Features
Modify the sensitive data patterns in `js/main.js` to detect different types of information.

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Notes

- All Tailwind CSS is loaded via CDN (~50KB)
- Custom CSS is minimal (~2KB)
- JavaScript is lightweight vanilla (~5KB)
- Total page weight: ~60KB (excluding images)

## Future Enhancements

- Add actual backend API integration
- Implement real data masking algorithms
- Add user authentication
- Create admin dashboard
- Add analytics tracking
- Implement PWA features

## License

© 2026 ARGUS OBSIDIAN. THE DIGITAL SENTINEL.
