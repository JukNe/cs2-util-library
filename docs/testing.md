# Testing Documentation

This document outlines the comprehensive testing suite for the CS2 Utility Library email verification restrictions.

## Test Structure

### Test Files Organization
```
src/__tests__/
├── utils/
│   └── test-utils.tsx          # Test utilities and mocks
├── lib/
│   └── session.test.ts         # Session validation tests
├── hooks/
│   └── useEmailVerification.test.ts  # Hook tests
├── components/
│   └── emailVerification/
│       ├── EmailVerificationBanner.test.tsx
│       ├── VerificationPrompt.test.tsx
│       └── EmailVerificationWrapper.test.tsx
├── api/
│   ├── auth/
│   │   └── check-user-limits.test.ts
│   └── utilities/
│       └── route.test.ts
└── e2e/
    └── email-verification-flow.test.tsx
```

## Test Categories

### 1. Unit Tests

#### Session Validation (`src/__tests__/lib/session.test.ts`)
- **validateSession**: Tests session token validation, expiration, and user retrieval
- **validateSessionWithVerification**: Tests email verification status inclusion
- **checkUnverifiedUserLimits**: Tests user creation limit calculations

**Key Test Cases:**
- No session token provided
- Invalid/expired session tokens
- Valid session with verified/unverified users
- User limit calculations for different scenarios

#### Hooks (`src/__tests__/hooks/useEmailVerification.test.ts`)
- **useEmailVerification**: Tests email resend functionality
- **useUserLimits**: Tests user limit fetching and state management
- **useVerificationError**: Tests error handling for verification requirements

**Key Test Cases:**
- Initial state validation
- Successful API calls
- Error handling (network, API errors)
- Loading state management
- Error detection and prompt display

### 2. Component Tests

#### EmailVerificationBanner (`src/__tests__/components/emailVerification/EmailVerificationBanner.test.tsx`)
- **Rendering**: Tests conditional rendering based on verification status
- **User Interactions**: Tests resend button functionality
- **State Management**: Tests loading, success, and error states
- **Accessibility**: Tests proper ARIA attributes and keyboard navigation

#### VerificationPrompt (`src/__tests__/components/emailVerification/VerificationPrompt.test.tsx`)
- **Variants**: Tests banner and modal variants
- **Content Display**: Tests custom titles and messages
- **User Interactions**: Tests resend functionality and link navigation
- **Styling**: Tests CSS class application

#### EmailVerificationWrapper (`src/__tests__/components/emailVerification/EmailVerificationWrapper.test.tsx`)
- **Conditional Rendering**: Tests banner vs prompt display logic
- **Limit Detection**: Tests automatic limit checking and UI updates
- **Hook Integration**: Tests integration with user limits hook
- **State Transitions**: Tests transitions between different states

### 3. API Tests

#### Check User Limits (`src/__tests__/api/auth/check-user-limits.test.ts`)
- **Authentication**: Tests unauthenticated access handling
- **Verified Users**: Tests unlimited access for verified users
- **Unverified Users**: Tests limit calculations for unverified users
- **Error Handling**: Tests database and validation errors

#### Utilities API (`src/__tests__/api/utilities/route.test.ts`)
- **GET Requests**: Tests utility retrieval with proper filtering
- **POST Requests**: Tests utility creation with verification restrictions
- **DELETE Requests**: Tests utility deletion with ownership validation
- **Limit Enforcement**: Tests unverified user limit enforcement

### 4. End-to-End Tests

#### Email Verification Flow (`src/__tests__/e2e/email-verification-flow.test.tsx`)
- **User Experience**: Tests complete user journeys
- **State Transitions**: Tests transitions between verification states
- **Error Scenarios**: Tests error handling in real-world scenarios
- **Integration**: Tests component and hook integration

## Test Utilities

### Mock Data (`src/__tests__/utils/test-utils.tsx`)
```typescript
// Session mocks
export const mockSession = { /* unverified user */ }
export const mockVerifiedSession = { /* verified user */ }

// API response mocks
export const mockApiResponses = {
  userLimits: { /* various limit scenarios */ },
  verificationError: { /* error responses */ },
  resendVerification: { /* success responses */ }
}
```

### Helper Functions
- **mockFetchResponse**: Creates mock fetch responses
- **createUserEvent**: Sets up user interaction testing
- **waitFor**: Async operation waiting utilities

## Running Tests

### Commands
```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with coverage
yarn test:coverage

# Run specific test file
yarn test session.test.ts

# Run tests matching pattern
yarn test --testNamePattern="email verification"
```

### Coverage Requirements
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

## Test Scenarios

### 1. Unverified User Journey
1. **Initial State**: User sees verification banner
2. **Create Utility**: Successfully creates first utility
3. **Create Second Utility**: Blocked with verification prompt
4. **Create Throwing Point**: Successfully creates first throwing point
5. **Create Second Throwing Point**: Blocked with verification prompt
6. **Verify Email**: No more restrictions

### 2. Verified User Journey
1. **Full Access**: No verification prompts
2. **Unlimited Creation**: Can create unlimited utilities and throwing points
3. **All Features**: Access to media upload, sharing, importing

### 3. Error Scenarios
1. **Network Errors**: Graceful error handling
2. **API Errors**: Proper error messages and recovery
3. **Session Expiry**: Automatic session validation
4. **Database Errors**: Fallback behavior

## Mocking Strategy

### Database Mocks
- **Prisma Client**: Mocked for all database operations
- **Session Validation**: Mocked for authentication testing
- **User Limits**: Mocked for limit calculation testing

### API Mocks
- **Fetch API**: Mocked for HTTP request testing
- **Response Simulation**: Mocked success and error responses
- **Network Conditions**: Mocked network delays and failures

### Component Mocks
- **Next.js Router**: Mocked for navigation testing
- **Next.js Components**: Mocked Link and Image components
- **External Dependencies**: Mocked for isolation

## Best Practices

### Test Organization
- **Arrange-Act-Assert**: Clear test structure
- **Descriptive Names**: Self-documenting test names
- **Single Responsibility**: Each test focuses on one behavior
- **Setup/Teardown**: Proper beforeEach/afterEach usage

### Mocking Guidelines
- **Minimal Mocks**: Only mock what's necessary
- **Realistic Data**: Use realistic mock data
- **Consistent Patterns**: Follow consistent mocking patterns
- **Documentation**: Document complex mock setups

### Assertion Patterns
- **User-Centric**: Test from user perspective
- **Accessibility**: Test accessibility features
- **Error States**: Test error handling thoroughly
- **Edge Cases**: Test boundary conditions

## Continuous Integration

### GitHub Actions
- **Automatic Testing**: Runs on every push and PR
- **Coverage Reporting**: Generates coverage reports
- **Test Results**: Publishes test results
- **Quality Gates**: Enforces coverage requirements

### Pre-commit Hooks
- **Lint Checking**: Ensures code quality
- **Test Running**: Runs tests before commits
- **Format Checking**: Ensures consistent formatting

## Debugging Tests

### Common Issues
1. **Async Operations**: Use proper waitFor and act
2. **Mock Setup**: Ensure mocks are properly configured
3. **State Management**: Test state changes correctly
4. **Component Lifecycle**: Handle component mounting/unmounting

### Debugging Tools
- **Jest Debugger**: Use debugger statements
- **Console Logging**: Add temporary console.log statements
- **Test Isolation**: Run tests in isolation
- **Mock Inspection**: Inspect mock calls and returns

## Future Enhancements

### Planned Improvements
1. **Visual Regression Testing**: Add visual testing
2. **Performance Testing**: Add performance benchmarks
3. **Accessibility Testing**: Add automated accessibility tests
4. **Integration Testing**: Add more E2E scenarios

### Test Coverage Expansion
1. **Edge Cases**: Add more boundary condition tests
2. **Error Scenarios**: Add more error handling tests
3. **User Interactions**: Add more user interaction tests
4. **API Integration**: Add more API integration tests
