"use client";

import { useState } from "react";
import { useForm } from "react-hook-form"
import Input from "../input";

type Inputs = {
    userName: string;
    email: string;
    password: string;
    passwordConfirmation: string;
}

interface SignUpProps {
    onBackToLogin: () => void;
}

export const SignUp = ({ onBackToLogin }: SignUpProps) => {
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Inputs>()

    const onSubmit = async (formData: Inputs) => {
        // Prevent multiple submissions
        if (loading) {
            return;
        }

        // Validate required fields
        if (!formData.userName || !formData.email || !formData.password) {
            setFormError("All fields are required");
            return;
        }
        setLoading(true);
        setFormError(null); // Clear any previous errors
        setSuccessMessage(null); // Clear any previous success messages

        const payload = {
            name: formData.userName,
            email: formData.email,
            password: formData.password
        }
        try {
            const response = await fetch('/api/auth/sign-up/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const res = await response.json();
            if (res.error || !res.success) {
                console.error('Signup error details:', res.error);
                setFormError(res.error ?? "An unknown error occurred.");
            } else {

                // Show success message and redirect to home page
                setSuccessMessage('Account created successfully! You are now signed in.');

                // Trigger auth status change event for header update
                window.dispatchEvent(new Event('auth-status-changed'));
                localStorage.setItem('auth-status', 'logged-in');

                // Force a page reload to ensure the session is properly recognized
                setTimeout(() => {
                    window.location.href = '/';
                }, 1500); // Redirect after 1.5 seconds
            }
        } catch (error) {
            console.error('Signup exception:', error);
            setFormError("An unexpected error occurred during sign-up.");
        }
        setLoading(false);
    };

    return (
        <>
            <h2> Sign Up</h2>
            <div>Enter your information to create an account</div>
            {formError && (
                <div style={{ color: "red" }}>{formError}</div>
            )}
            {successMessage && (
                <div style={{ color: "green" }}>{successMessage}</div>
            )}
            <form onSubmit={handleSubmit(onSubmit)} style={{ paddingTop: '2em' }}>
                <Input
                    {...register('userName', { required: "User name is required" })}
                    label={'Username'}
                    id="userName"
                    name="userName"
                    placeholder="First name"
                    errorMessage={errors.userName?.message}
                    style={{ width: '100%' }}
                    autoComplete="First name" />

                <Input
                    {...register('email', {
                        required: "Email is required",
                        pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: "Invalid email address"
                        }
                    })}
                    label={'Email'}
                    id="email"
                    name="email"
                    type='email'
                    placeholder="Email"
                    errorMessage={errors.email?.message}
                    style={{ width: '100%' }}
                />
                <Input
                    {...register('password', {
                        required: "Password is required",
                        minLength: {
                            value: 6,
                            message: "Password must be at least 6 characters"
                        }
                    })}
                    label={'Password'}
                    id="password"
                    name="password"
                    type='password'
                    placeholder="Password"
                    errorMessage={errors.password?.message}
                    style={{ width: '100%' }}
                />
                {/*  <Input
                    {...register('passwordConfirmation', passwordConfirmationValidation)}
                    label={'Password confirmation'}
                    id="passwordConfirmation"
                    type='password'
                    name="passwordConfirmation"
                    placeholder="password confirm"
                    errorMessage={errors.passwordConfirmation?.message}
                    style={{ width: '100%' }}
                /> */}
                <button
                    className="login-submit-btn"
                    type="submit"
                    disabled={loading}
                >
                    {loading ? "Signing up..." : "Sign Up"}
                </button>
            </form>
            <button
                type="button"
                style={{
                    marginTop: 16,
                    background: "none",
                    border: "none",
                    color: "#6c63ff",
                    textDecoration: "underline",
                    cursor: "pointer",
                    fontWeight: "bold",
                    fontSize: "1em"
                }}
                onClick={onBackToLogin}
            >
                Already have an account? Log in
            </button>
        </>
    );


}
export default SignUp;