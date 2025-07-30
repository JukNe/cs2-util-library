'use client'
import { forwardRef, HTMLInputTypeAttribute, useState } from "react";
import './style.scss';

interface InputProps {
    id: string;
    name: string;
    label: string;
    placeholder?: string;
    autoComplete?: string;
    errorMessage?: string;
    type?: HTMLInputTypeAttribute;
    style?: React.CSSProperties;
    onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}
const Input = forwardRef<HTMLInputElement, InputProps>(
    (
        { id, name, label, placeholder, autoComplete, errorMessage, type = "text", style, onChange },
        ref
    ) => {
        const [inputType, setInputType] = useState<HTMLInputTypeAttribute>(type);

        const switchType = (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            setInputType(inputType === 'text' ? 'password' : 'text');
            console.log(type)
        };

        return (
            <div className={'input-wrapper'}>
                <label className={'input-label'} htmlFor={id}>{label}</label>
                <div className="input-inner-wrapper">
                    <input
                        style={style}
                        ref={ref}
                        id={id}
                        name={name}
                        type={inputType}
                        placeholder={placeholder}
                        autoComplete={autoComplete}
                        onChange={onChange}
                    />
                    {type == 'password' && (
                        <button
                            type="button"
                            className="input-password-toggle"
                            onClick={switchType}
                            aria-label={inputType === 'password' ? 'Show password' : 'Hide password'}
                        >
                            {inputType === 'password' ? (
                                // Eye open SVG
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>
                            ) : (
                                // Eye off SVG
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.94 10.94 0 0 1 12 19c-7 0-11-7-11-7a21.81 21.81 0 0 1 5.06-6.06" /><path d="M1 1l22 22" /><path d="M9.53 9.53A3 3 0 0 0 12 15a3 3 0 0 0 2.47-5.47" /><path d="M14.47 14.47A3 3 0 0 1 12 9a3 3 0 0 1-2.47 5.47" /></svg>
                            )}
                        </button>
                    )}
                </div>
                {errorMessage && <div className={'input-error-message'}>{errorMessage}</div>}
            </div>
        );
    }
);

export default Input;