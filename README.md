# CS2 Utility Library

A comprehensive web application for Counter-Strike 2 players to create, manage, and share utility lineups across all competitive maps. Built with Next.js, TypeScript, and PostgreSQL.

![CS2 Utility Library](https://img.shields.io/badge/CS2-Utility%20Library-blue?style=for-the-badge&logo=steam)
![Next.js](https://img.shields.io/badge/Next.js-15.3.5-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13+-blue?style=for-the-badge&logo=postgresql)

## 🎯 Features

### 🗺️ **Map Support**
- **All Competitive Maps**: Dust II, Mirage, Inferno, Nuke, Overpass, Train, Cache, Ancient, Anubis, Vertigo
- **Interactive Map Viewer**: Click-to-place utility landing points and throwing positions
- **High-Quality Map Images**: Optimized WebP format for fast loading

### 💣 **Utility Management**
- **4 Utility Types**: Smoke, Flash, Molotov, HE Grenade
- **Team-Specific**: Separate utilities for Terrorist (T) and Counter-Terrorist (CT) sides
- **Multiple Throwing Points**: Each utility can have multiple throwing positions
- **Descriptions**: Add descriptions for each utility and throwing point

### 📸 **Media Integration**
- **Image & Video Support**: Upload screenshots, videos, and GIFs for utilities
- **Visual Learning**: Attach media to both utility landing and throwing points
- **Cloud Storage**: Secure media storage with Vercel Blob

### 🔗 **Sharing System**
- **One-Click Sharing**: Generate shareable links for utility collections
- **Import Functionality**: Import utilities shared by other players
- **Clipboard Integration**: Copy share links directly to clipboard
- **Public Share Pages**: Dedicated pages for viewing shared utilities

### 👤 **User Authentication**
- **Email Registration**: Secure user registration with email verification
- **Session Management**: Persistent login sessions with cookies
- **Password Security**: Bcrypt password hashing
- **Email Verification**: Required email verification for full access

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Prisma PostgreSQL database

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/cs2-util-library.git
   cd cs2-util-library
   ```

2. **Install dependencies**
   ```bash
   yarn install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/cs2_util_library"
   
   # Email (for verification)
   EMAIL_USER="your-email@gmail.com"
   EMAIL_PASSWORD="your-app-password"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   
   # Vercel Blob (for media uploads)
   BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"
   ```

4. **Set up the database**
   ```bash
   yarn prisma migrate dev --name init
   yarn prisma generate
   ```

5. **Run the development server**
   ```bash
   yarn dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📖 Usage Guide

### Getting Started

**First Time Users**: The app includes an interactive tutorial that will automatically start when you first visit a map. The tutorial guides you through:
- Selecting your team and utility type
- Adding landing points to the map
- Creating throwing points
- Using filters and sharing utilities

### Creating Utilities

1. **Select a Map**: Choose from the 10 available competitive maps
2. **Add Landing Point**: Click on the map to place a utility landing point
3. **Configure Utility**:
   - Select utility type (Smoke, Flash, Molotov, HE)
   - Choose team (T or CT)
   - Add title and description
4. **Add Throwing Points**: Click to add multiple throwing positions
5. **Upload Media**: Attach screenshots or videos for visual reference

### Managing Media

**Uploading New Media**:
- Use the upload section in the media carousel for utilities/throwing points
- Visit the dedicated `/media` page and click "Upload Media" to open the upload modal
- Drag and drop or click to select files
- Supports images (JPG, PNG, WebP, GIF) and videos (MP4, WebM, MOV, AVI)
- Maximum file size: 50MB

**Attaching Existing Media**:
- Click the "Attach Existing Media" button in the media carousel
- Browse your unattached media library
- Select and attach media to utilities or throwing points
- Media can be reused across different utilities and throwing points

**Media Preservation**:
- When utilities or throwing points are deleted, associated media becomes unattached
- Unattached media is preserved and can be reused
- Media is only deleted when explicitly removed by the user

**Media Library Page**:
- Access all your media at `/media`
- Click "Upload Media" button to open upload modal
- View, manage, and delete existing media
- Full-screen preview with navigation

**Media Organization**:
- Media is automatically organized by utility and throwing point
- Edit descriptions for better organization
- Delete media when no longer needed

### Sharing Utilities

1. **Select Utilities**: Choose which utilities to share
2. **Generate Share Link**: Click the "Share" button
3. **Copy Link**: The share link is automatically copied to clipboard
4. **Share**: Send the link to other players

### Importing Utilities

1. **Paste Share Code**: Paste a share link or code
2. **Preview**: Review the utilities before importing
3. **Import**: Click "Import Utilities" to add to your collection
4. **Access**: Find imported utilities in your map view

## 🏗️ Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **SCSS**: Advanced styling with CSS preprocessor
- **React Icons**: Comprehensive icon library
- **React Hook Form**: Form handling and validation

### Backend
- **Next.js API Routes**: Server-side API endpoints
- **Prisma ORM**: Type-safe database operations
- **PostgreSQL**: Reliable relational database
- **Nodemailer**: Email sending for verification
- **Bcrypt**: Secure password hashing

### Database Schema
```
User → Session (authentication)
Map → Utility → ThrowingPoint (core data)
Utility → Media (media attachments)
User → UtilityShare (sharing system)
```

### Key Components
- **AuthWrapper**: Authentication-based rendering
- **MapViewer**: Interactive map interface
- **UtilitySharing**: Share/import functionality
- **MediaUploader**: File upload handling
- **EmailVerification**: User verification system

## 🔧 Development

### Available Scripts
```bash
yarn dev          # Start development server
yarn build        # Build for production
yarn start        # Start production server
yarn lint         # Run ESLint
yarn clean        # Clean build artifacts
```

### Database Commands
```bash
yarn prisma generate    # Generate Prisma client
yarn prisma migrate dev # Run migrations
yarn prisma studio     # Open database GUI
```

### Project Structure
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── (maps)/         # Map pages
│   └── share/          # Share pages
├── components/         # React components
├── lib/               # Utility libraries
├── hooks/             # Custom React hooks
├── types/             # TypeScript definitions
└── utils/             # Helper functions
```

## 🔒 Security Features

- **Email Verification**: Required for account activation
- **Session Management**: Secure cookie-based sessions
- **Password Hashing**: Bcrypt with salt rounds
- **Input Validation**: Server-side validation for all inputs
- **CSRF Protection**: Built-in Next.js protection
- **Rate Limiting**: API endpoint protection


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Test thoroughly before submitting PRs
- Update documentation for new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/cs2-util-library/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cs2-util-library/discussions)
- **Email**: cs2utillibrary@gmail.com

---

**README written by Cursor**
