# Advanced Quiz Application

## Project Overview
This is an interactive web-based quiz application designed for managing competitive quiz events. The application features a dynamic scoring system, team management, and comprehensive timer controls, making it ideal for quiz competitions and educational settings.

## Project Structure
- `index.html`: Main quiz interface with question display and scoring
- `admin.html`: Administrative interface for managing teams and scores
- `script.js`: Core quiz logic, scoring system, and timer controls
- `admin.js`: Team management and administrative functions
- `styles.css`: Main application styling
- `admin-styles.css`: Admin interface styling
- `quiz_data.json`: Quiz questions and categories database
- `Audios/`: Sound effects and audio resources
- `NationalA/`: National anthem and related content
- `Pictures/`: Quiz-related images and assets

## Key Features
- Dynamic team management system
- Real-time scoring with anti-double-scoring protection
- Flexible timer system with pause/resume functionality
- Administrative interface for team editing
- Sound notifications for various events
- Comprehensive keyboard shortcuts
- Responsive design for different screen sizes

## Timer Controls
The application includes a sophisticated timer system with:
- Multiple preset durations
- Pause/Resume functionality
- Warning sounds at critical moments
- Visual countdown display

## Keyboard Shortcuts

### Timer Controls
- `1`: Start 30-second timer
- `2`: Start 15-second timer
- `3`: Start third timer
- `4`: Start fourth timer
- `0`: Pause current timer
- `5`: Resume paused timer

### Scoring and Answer Controls
- `C`: Show correct answer
- `I`: Show incorrect answer
- `P`: Play buzzer sound

### Navigation
- `N`: Go to National Anthem page
- `Q`: Return to quiz index
- `A`: Access admin panel
- `F`: Show quiz finished/winners
- `B`: Go back one question
- `V`: Return from category display

### Modal Controls
- `Esc`: Close active modal

## Team Management
The admin interface (`admin.html`) allows:
- Adding and removing teams
- Editing team names and members
- Real-time score tracking
- Score history management

## Getting Started
1. Clone or download the repository
2. Open `index.html` in a modern web browser
3. Use `admin.html` to set up teams
4. Begin the quiz!

## Administrative Access
1. Access the admin panel via `admin.html` or press `A`
2. Set up teams and manage scores
3. All changes are automatically saved

## Technical Details
- Built with vanilla JavaScript
- Uses localStorage for data persistence
- No external dependencies required
- Compatible with modern web browsers

## Last Updated
February 22, 2025
