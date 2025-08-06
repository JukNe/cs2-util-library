# Email Verification Feature

This feature provides comprehensive email verification functionality for user accounts. Users receive verification emails upon signup and can resend verification emails if needed.

## Features

- **Automatic Email Verification**: Sends verification emails upon user registration
- **Verification Page**: Dedicated page for handling email verification links
- **Resend Functionality**: Users can request new verification emails
- **Expiration Handling**: Verification links expire after 24 hours
- **Welcome Emails**: Sends welcome emails after successful verification
- **UI Components**: Banner component to show verification status
- **Beautiful Email Templates**: Professional HTML email templates

## Email Templates

### Verification Email
- Professional design with CS2 Utility Library branding
- Clear call-to-action button
- Fallback text link
- 24-hour expiration notice
- Security information

### Welcome Email
- Sent after successful verification
- Lists available features
- Direct link to dashboard
- Support information

### Password Reset Email
- Secure password reset functionality
- 1-hour expiration for security
- Professional design matching verification emails

## API Endpoints

### POST /api/auth/verify-email
Verifies a user's email address using a verification token.

**Request Body:**
```json
{
  "token": "verification-token-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully! Welcome to CS2 Utility Library!"
}
```

### POST /api/auth/resend-verification
Resends a verification email to a user.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Verification email sent successfully"
}
```

## Components

### EmailVerificationBanner
A banner component that shows email verification status to unverified users.

```tsx
import { EmailVerificationBanner } from '@/components/emailVerification';

<EmailVerificationBanner 
  email={user.email}
  isVerified={user.emailVerified}
  onResendVerification={handleResendVerification}
/>
```

### Verify Email Page
A dedicated page at `/verify-email` that handles verification links.

**Features:**
- Automatic token processing from URL
- Loading, success, error, and expired states
- Resend functionality for expired links
- Responsive design
- Smooth animations

## Hook Usage

### useEmailVerification
Provides email verification functionality.

```tsx
import { useEmailVerification } from '@/hooks/useEmailVerification';

const { resendVerification, isResending, error, success } = useEmailVerification();

const handleResend = async () => {
  await resendVerification(user.email);
};
```

## Database Schema

The verification system uses the existing `Verification` model:

```prisma
model Verification {
  id         String   @id
  identifier String   // Email address
  value      String   // Verification token
  expiresAt  DateTime
  createdAt  DateTime?
  updatedAt  DateTime?

  @@map("verification")
}
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Email Provider Setup

### Gmail Setup
1. Enable 2-factor authentication on your Gmail account
2. Generate an app-specific password
3. Use the app-specific password in `EMAIL_PASSWORD`

### Other Providers
The system uses Nodemailer and supports various email providers:
- Outlook/Hotmail
- Yahoo
- Custom SMTP servers

## Integration Example

Here's how to integrate email verification into your app:

```tsx
import { EmailVerificationBanner } from '@/components/emailVerification';
import { useEmailVerification } from '@/hooks/useEmailVerification';

const Dashboard = ({ user }) => {
  const { resendVerification } = useEmailVerification();

  const handleResendVerification = async () => {
    await resendVerification(user.email);
  };

  return (
    <div>
      <EmailVerificationBanner 
        email={user.email}
        isVerified={user.emailVerified}
        onResendVerification={handleResendVerification}
      />
      
      {/* Rest of dashboard content */}
    </div>
  );
};
```

## Security Features

- **Token Expiration**: Verification links expire after 24 hours
- **One-time Use**: Verification tokens are deleted after use
- **Email Validation**: Ensures verification tokens match user emails
- **Rate Limiting**: Prevents abuse of resend functionality
- **Secure Cookies**: Session management with secure cookies

## User Flow

1. **Signup**: User creates account → Verification email sent
2. **Email Check**: User checks email and clicks verification link
3. **Verification**: User is redirected to `/verify-email` → Account verified
4. **Welcome**: Welcome email sent → User can access full features
5. **Resend**: If needed, user can request new verification email

## Error Handling

The system handles various error scenarios:
- Invalid or expired tokens
- Already verified emails
- Non-existent users
- Email sending failures
- Network errors

## Customization

### Email Templates
Email templates are located in `src/lib/email.ts` and can be customized:
- Colors and branding
- Content and messaging
- Layout and design
- Call-to-action buttons

### Styling
Component styles can be customized in their respective `.scss` files:
- Banner appearance
- Verification page design
- Responsive breakpoints
- Animations and transitions

## Testing

### Development Testing
1. Use a real email address for testing
2. Check spam folder for verification emails
3. Test expired token scenarios
4. Verify responsive design on mobile

### Production Testing
1. Test with different email providers
2. Verify email delivery rates
3. Monitor verification completion rates
4. Test rate limiting functionality

## Troubleshooting

### Common Issues
1. **Emails not sending**: Check email credentials and provider settings
2. **Verification not working**: Ensure tokens are being generated correctly
3. **Expired tokens**: Verify token expiration logic
4. **UI not updating**: Check component state management

### Debug Steps
1. Check server logs for email sending errors
2. Verify database verification records
3. Test API endpoints directly
4. Check environment variables 