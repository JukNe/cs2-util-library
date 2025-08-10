import '@testing-library/jest-dom'

declare global {
    namespace jest {
        interface Matchers<R, T> {
            toBeInTheDocument(): R
            toBeDisabled(): R
            toHaveAttribute(attr: string, value?: string): R
        }
    }
}
