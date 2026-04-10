# 🍽️ Meal Master — Your Ultimate Culinary Companion

Meal Master is a premium, responsive web application designed for food enthusiasts who want to discover, save, and plan their meals with elegance and ease. Built with high-performance Vanilla JS and a sophisticated boutique aesthetic, it offers a seamless experience from recipe discovery to shopping list generation.

[**✨ View Live Demo**](https://meal-master-recipe-finder-xi.vercel.app)

---

## 🌟 Key Features

- **🔍 Intelligent Discovery**: Search through thousands of recipes from TheMealDB API by name, main ingredient, or category.
- **🎨 Premium UX/UI**: A "Culinary Boutique" theme featuring glassmorphism, stagger animations, and a refined typography system.
- **❤️ Smart Favorites**: Bookmark your favorite recipes and access them instantly even after closing the browser (persisted via LocalStorage).
- **🛒 Dynamic Shopping List**: Compile ingredients from up to 3 recipes into a unified shopping list with automatic ingredient grouping.
- **🌗 Dark Mode**: A beautifully crafted dark theme for comfortable late-night recipe browsing.

## 🛠️ Tech Stack

- **Frontend**: Semantic HTML5, CSS3 (Custom Properties, Glassmorphism).
- **Logic**: Vanilla JavaScript (ES6+), Event Delegation, State Management.
- **API**: [TheMealDB API](https://www.themealdb.com/api.php).
- **Deployment**: [Vercel](https://vercel.com).
- **Icons**: [Ionicons](https://ionicons.com).

## 📐 Architecture & Performance

This project demonstrates high-performance frontend engineering in a vanilla environment:
- **Centralized Global State**: Uses a single source of truth for favorites, shopping lists, and theme preferences.
- **Event Delegation**: Optimized event handling where a single listener on the grid container manages interactions for hundreds of dynamically generated recipe cards, significantly reducing memory overhead.
- **CSS-Powered Animations**: Leverages hardware-accelerated CSS animations (`stagger-in`) for smooth transitions without taxing the main thread.
- **Persisted State**: Robust integration with `localStorage` for a "session-less" user experience.

## 🚀 Getting Started

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/nihaaljangam-glitch/Meal-Master-Recipe-Find-.git
   ```
2. Navigate to the project directory:
   ```bash
   cd Meal-Master-Recipe-Find-
   ```
3. Open `index.html` in your favorite browser.

## 📝 Final Project Details

- **Version**: 1.0.0 (Boutique Edition)
- **Author**: nihaaljangam-glitch
- **License**: MIT
- **Project Goal**: To create a technical showcase of high-end UI/UX built entirely without frameworks.

---
*Created with ❤️ by nihaaljangam-glitch & Antigravity AI*
