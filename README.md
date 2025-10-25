# Storyboard Webapp

A comprehensive storyboard web application built with React, TypeScript, and modern web technologies. This application provides a powerful suite of tools for writers, storytellers, and content creators to manage their creative projects.

## Features

### 🖥️ Multi-Window Interface
- **Resizable Windows**: Drag and resize windows to your preferred layout
- **Window Management**: Minimize, restore, and close windows independently
- **Flexible Layout**: Arrange document editor, storyboard view, and database view as needed

### 📝 Document Editor
- **Rich Text Editing**: Full-featured editor similar to Microsoft Word
- **Auto-save**: Automatic saving with visual indicators for unsaved changes
- **Word Count**: Real-time word count and document statistics
- **Multiple Document Types**: Support for stories, outlines, notes, and research

### 🎨 Storyboard View
- **Infinite Canvas**: Seamless, borderless canvas that extends infinitely
- **Drawing Tools**: Freehand drawing with customizable brush size and colors
- **Element Management**: Add characters, locations, plot points, and notes
- **Visual Connections**: Link story elements with visual connections
- **Timeline View**: Organize elements chronologically with chapter grouping
- **Zoom & Pan**: Navigate the canvas with smooth zoom and pan controls

### 🗄️ Database Management
- **Relational Database**: Store and manage characters, locations, plot points, and chapters
- **CRUD Operations**: Create, read, update, and delete database entries
- **Relationship Tracking**: Link characters to plot points and locations
- **Search & Filter**: Find specific elements quickly
- **Data Validation**: Ensure data integrity with proper validation

### 🎭 Character Management
- **Detailed Profiles**: Name, description, age, role, appearance, personality, background
- **Role Classification**: Protagonist, antagonist, supporting, minor characters
- **Relationship Mapping**: Track character relationships and connections

### 📍 Location Management
- **Location Types**: Indoor, outdoor, urban, rural, fantasy, sci-fi
- **Atmosphere & Significance**: Detailed location descriptions and story importance
- **Visual Positioning**: Position locations on the storyboard canvas

### 📊 Plot Point Management
- **Story Structure**: Inciting incident, rising action, climax, falling action, resolution
- **Importance Levels**: Critical, high, medium, low importance classification
- **Character & Location Links**: Connect plot points to relevant characters and locations
- **Chapter Organization**: Group plot points by chapters

### 📚 Chapter Management
- **Chapter Organization**: Order chapters and track their status
- **Status Tracking**: Draft, in progress, completed, archived
- **Plot Point Integration**: Link chapters to their plot points

### 🌓 Theme System
- **Light/Dark Mode**: Toggle between light and dark themes
- **Consistent Styling**: All components adapt to the selected theme
- **Persistent Settings**: Theme preference is saved across sessions

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **State Management**: Zustand
- **Database**: Dexie (IndexedDB wrapper)
- **Styling**: Tailwind CSS
- **Rich Text Editor**: React Quill
- **Canvas**: Fabric.js
- **Testing**: Vitest with React Testing Library
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd storyboard-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/          # React components
│   ├── DatabaseView/   # Database management components
│   ├── DocumentEditor/ # Rich text editor
│   ├── Sidebar/        # Navigation sidebar
│   ├── StoryboardView/ # Canvas and storyboard components
│   └── WindowManager/  # Window management system
├── database/           # Database schema and configuration
├── store/             # Zustand state management
├── test/              # Test files
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## Database Schema

The application uses a relational database structure with the following main entities:

- **Characters**: Character profiles with detailed information
- **Locations**: Story locations with type and atmosphere
- **Plot Points**: Story events with structure and importance
- **Chapters**: Story organization with status tracking
- **Storyboard Elements**: Canvas elements with positioning and styling
- **Documents**: Rich text documents with metadata

## Testing

The project follows Test-Driven Development (TDD) principles with comprehensive test coverage:

- **Unit Tests**: Individual component and function testing
- **Integration Tests**: Component interaction testing
- **Database Tests**: Data persistence and retrieval testing
- **Store Tests**: State management testing

Run tests with:
```bash
npm run test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Implement the feature
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Future Enhancements

- **Collaboration**: Real-time collaborative editing
- **Export/Import**: Export to various formats (PDF, Word, etc.)
- **Templates**: Pre-built story templates
- **Advanced Drawing**: More drawing tools and shapes
- **Cloud Sync**: Cloud storage integration
- **Mobile Support**: Responsive mobile interface
- **Plugin System**: Extensible plugin architecture

## Support

For support, questions, or feature requests, please open an issue on the GitHub repository.
