import '@testing-library/jest-dom'

declare global {
    namespace jest {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Matchers signature mirrors @types/jest
        interface Matchers<R, T = unknown> {
            toBeInTheDocument(): R
            toBeDisabled(): R
            toHaveAttribute(attr: string, value?: string): R
        }
    }
}
