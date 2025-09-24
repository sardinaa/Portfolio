# Portfolio JSON Configuration System

This portfolio now supports a centralized JSON configuration system that allows you to easily update all portfolio content, including terminal sections, contact information, hobbies, and UI text from a single configuration file.

## Configuration File

The main configuration file is located at:
```
src/config/portfolio.json
```

## Configuration Structure

### Profile Information
```json
{
  "profile": {
    "name": "Your Name",
    "title": "Your Professional Title",
    "profileImage": "/path/to/image.jpg",
    "cvPath": "/path/to/cv.pdf",
    "cvDownloadName": "filename.pdf"
  }
}
```

### Contact Information
```json
{
  "contact": {
    "email": "your@email.com",
    "phone": "+1 (555) 123-4567",
    "website": "https://yourwebsite.dev",
    "linkedin": "/in/your-profile",
    "github": "github.com/yourusername"
  }
}
```

### Hobbies (3D Scene Interactions)
```json
{
  "hobbies": {
    "plant": {
      "title": "🌱 Hobby Title",
      "description": "Description of your hobby...",
      "details": ["Detail 1", "Detail 2", "Detail 3"]
    },
    "camera": { /* ... */ },
    "shoes": { /* ... */ }
  }
}
```

### Terminal Portfolio Sections

The terminal interface supports these sections, all configurable via JSON:

#### About Section
```json
{
  "about": {
    "title": "About Me",
    "content": "Your personal introduction...",
    "specialties": ["Specialty 1", "Specialty 2"]
  }
}
```

#### Projects Section
```json
{
  "projects": {
    "title": "Featured Projects",
    "projects": [
      {
        "name": "Project Name",
        "icon": "🌐",
        "description": "Project description...",
        "technologies": "Tech stack used"
      }
    ],
    "footer": "Additional info or call to action"
  }
}
```

#### Skills Section
```json
{
  "skills": {
    "title": "Technical Skills",
    "categories": [
      {
        "name": "Category Name",
        "skills": ["Skill 1", "Skill 2", "Skill 3"]
      }
    ]
  }
}
```

#### Experience Section
```json
{
  "experience": {
    "title": "Work Experience",
    "positions": [
      {
        "title": "Job Title",
        "company": "Company Name",
        "period": "2020 - Present",
        "highlights": ["Achievement 1", "Achievement 2"]
      }
    ]
  }
}
```

#### Education Section
```json
{
  "education": {
    "title": "Education",
    "degree": {
      "title": "Bachelor of Science in Computer Science",
      "school": "University Name",
      "period": "2014 - 2018",
      "details": ["GPA: 3.8/4.0", "Honor details"]
    },
    "coursework": ["Course 1", "Course 2"],
    "projects": ["Project 1", "Project 2"]
  }
}
```

#### Certifications Section
```json
{
  "certifications": {
    "title": "Professional Certifications",
    "certifications": [
      {
        "name": "Certification Name",
        "year": "2023",
        "issuer": "Issuing Organization"
      }
    ],
    "footer": "Additional certification info"
  }
}
```

#### Leadership Section
```json
{
  "leadership": {
    "title": "Leadership & Achievements",
    "experience": [
      {
        "role": "Leadership Role",
        "period": "2022 - Present",
        "highlights": ["Highlight 1", "Highlight 2"]
      }
    ],
    "achievements": ["Achievement 1", "Achievement 2"],
    "community": ["Community activity 1", "Community activity 2"]
  }
}
```

## Usage

### Accessing Configuration in Code

```typescript
import { portfolioConfig } from '../config';

// Get profile information
const name = portfolioConfig.getProfileName();
const title = portfolioConfig.getProfileTitle();

// Get contact information
const contact = portfolioConfig.getContact();
const email = portfolioConfig.getContactEmail();

// Get hobbies information
const hobbies = portfolioConfig.getHobbies();
const plantHobby = portfolioConfig.getHobby('plant');

// Get terminal sections
const aboutSection = portfolioConfig.getTerminalSection('about');
const projectsSection = portfolioConfig.getTerminalSection('projects');
```

### Configuration Manager API

The `PortfolioConfigManager` provides these methods:

- `getProfile()` - Get complete profile object
- `getProfileName()` - Get profile name
- `getProfileTitle()` - Get professional title
- `getProfileImage()` - Get profile image path
- `getCVPath()` - Get CV file path
- `getCVDownloadName()` - Get CV download filename
- `getContact()` - Get complete contact object
- `getContactEmail()` - Get email address
- `getHobbies()` - Get all hobbies
- `getHobby(key)` - Get specific hobby
- `getTerminalSection(section)` - Get specific terminal section
- `getUIConfig()` - Get UI configuration

### Dynamic Updates

You can update configuration at runtime:

```typescript
// Update profile information
portfolioConfig.updateProfile({
  name: "New Name",
  title: "New Title"
});

// Update contact information
portfolioConfig.updateContact({
  email: "newemail@example.com"
});

// Update hobby information
portfolioConfig.updateHobby('plant', {
  title: "🌿 New Hobby Title"
});
```

## Benefits

1. **Centralized Content Management** - All content in one JSON file
2. **Easy Updates** - Change text without touching code
3. **Type Safety** - TypeScript interfaces ensure data integrity
4. **Maintainability** - Clear separation of content and logic
5. **Extensibility** - Easy to add new sections or fields
6. **Dynamic Updates** - Content can be updated at runtime

## File Structure

```
src/
├── config/
│   ├── portfolio.json      # Main configuration file
│   ├── types.ts           # TypeScript interfaces
│   └── index.ts           # Configuration manager
├── components/            # Updated to use config
├── ui/                   # Updated to use config
└── core/                 # Updated to use config
```

## Migration from Hardcoded Content

The portfolio has been successfully migrated from hardcoded content to the JSON configuration system. All existing functionality is preserved while providing much better maintainability and flexibility.

To customize your portfolio:
1. Edit `src/config/portfolio.json`
2. Update the content as needed
3. The changes will be reflected immediately in development mode

## Best Practices

1. Keep the JSON structure intact when making changes
2. Use meaningful descriptions and clear content
3. Test the portfolio after making changes
4. Consider adding new sections by extending the configuration schema
5. Use the TypeScript interfaces for type safety when adding new features
