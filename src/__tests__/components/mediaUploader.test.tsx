import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MediaUploader from '@/components/mediaUploader';

// Mock the upload function
const mockUploadComplete = jest.fn();

describe('MediaUploader', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should accept image files under 10MB', () => {
        render(<MediaUploader onUploadComplete={mockUploadComplete} />);

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 }); // 5MB

        const fileInput = screen.getByRole('button', { name: /click or drag files/i });
        fireEvent.click(fileInput);

        // Get the hidden file input and trigger change event
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        // Should not show error for valid image size
        expect(screen.queryByText(/Image files must be less than 10 MB/)).not.toBeInTheDocument();
    });

    it('should reject image files over 10MB', () => {
        render(<MediaUploader onUploadComplete={mockUploadComplete} />);

        const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
        Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 }); // 15MB

        const fileInput = screen.getByRole('button', { name: /click or drag files/i });
        fireEvent.click(fileInput);

        // Get the hidden file input and trigger change event
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        // Should show error for oversized image
        expect(screen.getByText(/Image files must be less than 10 MB/)).toBeInTheDocument();
    });

    it('should accept video files under 50MB', () => {
        render(<MediaUploader onUploadComplete={mockUploadComplete} />);

        const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
        Object.defineProperty(file, 'size', { value: 25 * 1024 * 1024 }); // 25MB

        const fileInput = screen.getByRole('button', { name: /click or drag files/i });
        fireEvent.click(fileInput);

        // Get the hidden file input and trigger change event
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        // Should not show error for valid video size
        expect(screen.queryByText(/Video files must be less than 50 MB/)).not.toBeInTheDocument();
    });

    it('should reject video files over 50MB', () => {
        render(<MediaUploader onUploadComplete={mockUploadComplete} />);

        const file = new File(['test'], 'test.mp4', { type: 'video/mp4' });
        Object.defineProperty(file, 'size', { value: 60 * 1024 * 1024 }); // 60MB

        const fileInput = screen.getByRole('button', { name: /click or drag files/i });
        fireEvent.click(fileInput);

        // Get the hidden file input and trigger change event
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        fireEvent.change(input, { target: { files: [file] } });

        // Should show error for oversized video
        expect(screen.getByText(/Video files must be less than 50 MB/)).toBeInTheDocument();
    });

    it('should display correct file size limits in UI', () => {
        render(<MediaUploader variant="standalone" />);

        expect(screen.getByText(/Maximum file size: Images 10MB, Videos 50MB/)).toBeInTheDocument();
    });

    it('should display correct file size limits in default variant', () => {
        render(<MediaUploader />);

        expect(screen.getByText(/Supports image and video files \(Images: 10MB, Videos: 50MB\)/)).toBeInTheDocument();
    });
});
