# Email Verification Restrictions

This document outlines the email verification restrictions implemented in the CS2 Utility Library application.

## Overview

Unverified users have limited access to certain features to encourage email verification and prevent abuse. Verified users have full access to all features.

## Restrictions for Unverified Users

### Content Creation Limits
- **Utilities (Landing Points)**: Maximum 1 utility
- **Throwing Points**: Maximum 1 throwing point
- **Media Uploads**: Not allowed
- **Sharing**: Not allowed
- **Importing**: Not allowed

### Allowed Actions
- View existing utilities
- Browse maps
- View shared utilities (via share links)
- View media
- Delete their own utilities and throwing points

## Implementation Details

### Backend API Restrictions

#### Session Validation
- Updated `validateSession` to include email verification status
- Added `validateSessionWithVerification` function
- Added `checkUnverifiedUserLimits` function

#### API Endpoints with Restrictions

1. **POST /api/utilities** - Create utility
   - Checks if user is verified
   - For unverified users, limits to 1 utility
   - Returns 403 with `requiresVerification: true` if limit exceeded

2. **POST /api/utilities/throwing-points** - Create throwing point
   - Checks if user is verified
   - For unverified users, limits to 1 throwing point
   - Returns 403 with `requiresVerification: true` if limit exceeded

3. **POST /api/media/upload** - Upload media
   - Blocks all unverified users
   - Returns 403 with `requiresVerification: true`

4. **POST /api/utilities/share** - Share utilities
   - Blocks all unverified users
   - Returns 403 with `requiresVerification: true`

5. **POST /api/utilities/import** - Import utilities
   - Blocks all unverified users
   - Returns 403 with `requiresVerification: true`

### Frontend Components

#### Email Verification Components
- `EmailVerificationBanner` - Shows verification banner for unverified users
- `VerificationPrompt` - Shows limit reached prompts
- `VerificationErrorHandler` - Handles API errors requiring verification
- `EmailVerificationWrapper` - Wraps content with verification checks

#### Hooks
- `useEmailVerification` - Handle resending verification emails
- `useUserLimits` - Check user creation limits
- `useVerificationError` - Handle verification-related API errors

### API Endpoints

#### New Endpoints
- `GET /api/auth/check-user-limits` - Get user limits and verification status

## User Experience

### For Unverified Users
1. **Initial Experience**: Can create 1 utility and 1 throwing point
2. **Limit Reached**: Shows verification prompt with clear messaging
3. **API Errors**: Automatic modal prompts for verification
4. **Banner**: Persistent verification banner at top of page

### For Verified Users
- Full access to all features
- No restrictions or prompts

## Error Handling

### API Error Responses
```json
{
  "success": false,
  "error": "Unverified users can only create one utility. Please verify your email to create more utilities.",
  "requiresVerification": true
}
```

### Frontend Error Handling
- Automatic detection of verification-required errors
- Modal prompts for verification
- Clear messaging about limits and requirements

## Styling

### Verification Banner
- Blue gradient background
- White text
- Responsive design
- Action buttons for resend and manual verification

### Limit Prompt
- Orange gradient background
- Warning icon
- Clear messaging about limits
- Call-to-action for verification

### Error Modal
- Overlay with backdrop blur
- Centered modal design
- Consistent styling with other prompts

## Testing

### Test Cases
1. **Unverified User Creation Limits**
   - Create 1 utility (should succeed)
   - Create 2nd utility (should fail with verification prompt)
   - Create 1 throwing point (should succeed)
   - Create 2nd throwing point (should fail with verification prompt)

2. **Blocked Features**
   - Media upload (should fail)
   - Sharing (should fail)
   - Importing (should fail)

3. **Verified User Access**
   - All features should work normally
   - No restrictions or prompts

4. **Error Handling**
   - API errors should show appropriate prompts
   - Verification prompts should be dismissible
   - Resend functionality should work

## Future Enhancements

### Potential Improvements
1. **Progressive Limits**: Allow more content as users engage more
2. **Time-based Limits**: Reset limits after certain time periods
3. **Feature-specific Limits**: Different limits for different features
4. **Admin Override**: Allow admins to bypass limits for specific users
5. **Analytics**: Track verification rates and user behavior

### Configuration
- Make limits configurable via environment variables
- Allow different limits for different user tiers
- Configurable messaging and prompts
