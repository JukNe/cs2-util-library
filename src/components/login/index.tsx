'use client'

import { useState } from "react";
import { SignUp } from "./sign-up";
import { useRouter } from "next/navigation";
import { SubmitHandler, useForm } from "react-hook-form";
import Input from "../input";
import './style.scss';


type Inputs = {
    email: string;
    password: string;
    rememberMe: boolean;
}

const LoginForm = () => {
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSignUp, setIsSignUp] = useState(false);
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<Inputs>();

    const onSubmit: SubmitHandler<Inputs> = async (formData) => {
        setLoading(true);
        setErrorMessage(null);
        try {
            console.log('=== SIGNIN DEBUG ===');
            console.log('Signin payload:', { email: formData.email, password: formData.password, rememberMe: formData.rememberMe });

            const response = await fetch('/api/auth/sign-in/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    rememberMe: formData.rememberMe,
                    callbackURL: '/'
                }),
            });

            const res = await response.json();
            console.log('Signin response:', res);

            if (!res.success) {
                console.error('Signin error:', res.error);
                setErrorMessage(res.error || "Invalid email or password.");
                setLoading(false);
                return;
            }

            console.log('Signin successful!');
            setLoading(false);

            // Trigger auth status change event for header update
            window.dispatchEvent(new Event('auth-status-changed'));
            localStorage.setItem('auth-status', 'logged-in');

            // Force a page reload to ensure the session is properly recognized
            console.log('Redirecting to home page...');
            window.location.href = '/';
        } catch (err: unknown) {
            console.error('Signin exception:', err);
            setLoading(false);
            setErrorMessage("Invalid email or password.");
        }
    };


    const handleForgotPassword = () => {
        // Implement forgot password logic or redirect
        //TODO: Implement forgot password logic or redirect

        alert("Redirect to forgot password page.");
    };

    return (
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "1em", backgroundColor: "#3c3c3c", borderRadius: "0.5em", alignContent: "center" }}>
            {isSignUp ? (
                <SignUp onBackToLogin={() => setIsSignUp(false)} />
            ) : (
                <>
                    <h2>Sign In</h2>
                    <form onSubmit={handleSubmit(onSubmit)}>
                        <Input
                            style={{ width: '100%' }}
                            {...register("email", { required: "Email is required" })}
                            label="Email"
                            id="email"
                            type="email"
                            placeholder="Email"
                            errorMessage={errors.email?.message}
                        />
                        <Input
                            {...register("password", { required: "Password is required" })}
                            style={{ width: '100%' }}
                            label="Password"
                            id="password"
                            type="password"
                            placeholder="Password"
                            errorMessage={errors.password?.message}
                        />
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "1em 0" }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                <input
                                    type="checkbox"
                                    {...register("rememberMe")}
                                    style={{ marginRight: 4 }}
                                />
                                Remember me
                            </label>
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                style={{
                                    background: "none",
                                    border: "none",
                                    color: "#0070f3",
                                    textDecoration: "underline",
                                    cursor: "pointer",
                                    padding: 0,
                                    fontSize: "1em"
                                }}
                                tabIndex={0}
                            >
                                Forgot password?
                            </button>
                        </div>
                        {errorMessage && (
                            <div style={{ color: "red", marginBottom: 8 }}>{errorMessage}</div>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="login-submit-btn"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                    <div style={{ textAlign: "center", marginTop: 12 }}>
                        <span>Don&apos;t have an account?</span>
                        <button
                            type="button"
                            onClick={() => setIsSignUp(true)}
                            style={{
                                marginLeft: 8,
                                background: "#eaeaea",
                                border: "none",
                                color: "#0070f3",
                                padding: "8px 16px",
                                borderRadius: 4,
                                cursor: "pointer",
                                fontWeight: "bold"
                            }}
                        >
                            Sign Up
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

export default LoginForm;