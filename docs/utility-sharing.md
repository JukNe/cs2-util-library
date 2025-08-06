# Utility Sharing Feature

This feature allows users to share and import utility setups between different users. Users can export their utility configurations for a specific map and share them with others via share codes or URLs.

## Features

- **Export Utilities**: Share your utility setups with other users
- **Import Utilities**: Import utility setups from other users
- **Share Codes**: Generate unique codes for sharing utilities
- **URL Sharing**: Create shareable URLs for easy distribution
- **Validation**: Validate share codes before importing
- **Database Tracking**: Track shared utilities in the database

## Components

### ShareButton
A button component that allows users to export their utilities for a specific map.

```tsx
import { ShareButton } from '@/components/utilitySharing';

<ShareButton 
  mapName="mirage" 
  utilities={userUtilities} 
  className="custom-share-button"
/>
```

### ImportButton
A button component that allows users to import utilities from share codes.

```tsx
import { ImportButton } from '@/components/utilitySharing';

<ImportButton 
  onImportSuccess={() => {
    // Refresh utilities after successful import
    refreshUtilities();
  }}
  className="custom-import-button"
/>
```

## Hook Usage

### useUtilitySharing

The main hook that provides all sharing functionality.

```tsx
import { useUtilitySharing } from '@/hooks/useUtilitySharing';

const {
  exportUtilities,
  exportToClipboard,
  importUtilities,
  validateShareCode,
  isExporting,
  isImporting,
  error,
  generateShareCode,
  parseShareCode
} = useUtilitySharing();
```

### Methods

#### exportUtilities(mapName, utilities, description?)
Exports utilities and returns a share code.

```tsx
const shareCode = await exportUtilities('mirage', utilities, 'My Mirage setup');
```

#### exportToClipboard(mapName, utilities, description?)
Exports utilities and copies the share URL to clipboard.

```tsx
await exportToClipboard('mirage', utilities, 'My Mirage setup');
// Copies: https://yourapp.com/share/ABC123...
```

#### importUtilities(shareCode)
Imports utilities from a share code.

```tsx
const importedData = await importUtilities('ABC123...');
console.log(`Imported ${importedData.utilities.length} utilities for ${importedData.mapName}`);
```

#### validateShareCode(shareCode)
Validates if a share code is valid.

```tsx
const isValid = validateShareCode('ABC123...');
```

## API Endpoints

### POST /api/utilities/share
Saves a share record to the database.

**Request Body:**
```json
{
  "mapName": "mirage",
  "shareCode": "base64EncodedData",
  "description": "Optional description"
}
```

### GET /api/utilities/share
Retrieves all utilities shared by the current user.

### POST /api/utilities/import
Imports utilities from a share code.

**Request Body:**
```json
{
  "mapName": "mirage",
  "utilities": [...]
}
```

## Database Schema

### UtilityShare Model
```prisma
model UtilityShare {
  id          String   @id @default(cuid())
  shareCode   String   @unique // Base64 encoded share data
  mapName     String   // Name of the map
  description String?  // Optional description
  sharedBy    String   // User ID who shared the utilities
  sharedAt    DateTime @default(now())
  user        User     @relation(fields: [sharedBy], references: [id], onDelete: Cascade)

  @@map("utility_share")
}
```

## Share Code Format

Share codes are base64-encoded JSON strings containing:

```json
{
  "mapName": "mirage",
  "utilities": [
    {
      "id": "utility_id",
      "map": "mirage",
      "utilityType": "smoke",
      "team": "T",
      "title": "A Site Smoke",
      "description": "Smoke for A site",
      "position": {
        "X": 50.5,
        "Y": 30.2
      },
      "throwingPoints": [
        {
          "id": "tp_id",
          "position": {
            "X": 45.2,
            "Y": 25.1
          },
          "title": "Throw from T Spawn",
          "description": "Line up with the corner",
          "url": ""
        }
      ]
    }
  ],
  "sharedBy": "user@example.com",
  "sharedAt": "2024-01-01T00:00:00.000Z",
  "description": "Optional description"
}
```

## Usage Example

Here's a complete example of how to integrate the sharing feature into a map viewer:

```tsx
import { ShareButton, ImportButton } from '@/components/utilitySharing';
import { useUtilitySharing } from '@/hooks/useUtilitySharing';

const MapViewer = ({ mapName, utilities }) => {
  const { refreshUtilities } = useUtilitySharing();

  return (
    <div>
      {/* Map content */}
      
      {/* Sharing controls */}
      <div className="sharing-controls">
        <ShareButton 
          mapName={mapName} 
          utilities={utilities}
        />
        <ImportButton 
          onImportSuccess={refreshUtilities}
        />
      </div>
    </div>
  );
};
```

## Security Considerations

- Share codes are validated before processing
- Users can only import utilities to their own account
- Share records are tracked for audit purposes
- Authentication is required for all sharing operations

## Error Handling

The hook provides error states and messages:

```tsx
const { error, isExporting, isImporting } = useUtilitySharing();

if (error) {
  console.error('Sharing error:', error);
}

if (isExporting) {
  // Show loading state
}

if (isImporting) {
  // Show importing state
}
```

## Future Enhancements

- Public/private sharing options
- Share expiration dates
- Share analytics and tracking
- Bulk import/export functionality
- Share code QR codes
- Social sharing integration 