import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter() {
        return {
            route: '/',
            pathname: '/',
            query: {},
            asPath: '/',
            push: jest.fn(),
            pop: jest.fn(),
            reload: jest.fn(),
            back: jest.fn(),
            prefetch: jest.fn().mockResolvedValue(undefined),
            beforePopState: jest.fn(),
            events: {
                on: jest.fn(),
                off: jest.fn(),
                emit: jest.fn(),
            },
            isFallback: false,
        }
    },
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
    return ({ children, href, ...props }) => {
        return (
            <a href={href} {...props}>
                {children}
            </a>
        )
    }
})

// Mock Next.js Image component
jest.mock('next/image', () => {
    return ({ src, alt, ...props }) => {
        return <img src={src} alt={alt} {...props} />
    }
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock Request for API route tests
global.Request = class Request {
    constructor(url, options = {}) {
        Object.defineProperty(this, 'url', {
            value: url,
            writable: false,
            configurable: true
        })
        this.method = options.method || 'GET'
        this.body = options.body

        // Mock headers with entries method
        this.headers = {
            ...options.headers,
            entries: () => Object.entries(options.headers || {}),
            get: (name) => options.headers?.[name],
            has: (name) => name in (options.headers || {}),
            set: (name, value) => {
                if (!this.headers) this.headers = {}
                this.headers[name] = value
            }
        }

        // Add json method for request body parsing
        this.json = () => {
            if (typeof this.body === 'string') {
                return Promise.resolve(JSON.parse(this.body))
            }
            return Promise.resolve(this.body)
        }
    }
}

// Mock Response for API route tests
global.Response = class Response {
    constructor(body, options = {}) {
        this.body = body
        this.status = options.status || 200
        this.statusText = options.statusText || 'OK'
        this.headers = options.headers || {}
    }

    json() {
        if (typeof this.body === 'string') {
            return Promise.resolve(JSON.parse(this.body))
        }
        return Promise.resolve(this.body)
    }
}

// Mock NextResponse
global.NextResponse = {
    json: (data, options = {}) => {
        const response = new Response(JSON.stringify(data), {
            status: options.status || 200,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        })
        // Add json method to the response for testing
        response.json = () => Promise.resolve(data)
        return response
    }
}

// Mock Next.js server module
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data, options = {}) => {
            const response = new Response(JSON.stringify(data), {
                status: options.status || 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                }
            })
            response.json = () => Promise.resolve(data)
            return response
        }
    },
    NextRequest: global.Request
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
})

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
}

// Suppress console errors in tests unless explicitly needed
const originalError = console.error
beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Warning: ReactDOM.render is no longer supported') ||
                args[0].includes('An update to') && args[0].includes('inside a test was not wrapped in act') ||
                args[0].includes('Error checking user limits:'))
        ) {
            return
        }
        originalError.call(console, ...args)
    }
})

afterAll(() => {
    console.error = originalError
})
