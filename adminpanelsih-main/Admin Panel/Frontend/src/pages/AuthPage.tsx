import React, { useState } from 'react';
import { AtSign, Lock, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

// Helper component for the Login Panel, containing the multi-step form logic.
const LoginPanel = ({ setAuthMode }) => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('ishaan.saxena@mca.gov.in');
    const [password, setPassword] = useState('password');
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();

    const handleNext = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (step === 1 && email) {
                setStep(2);
            } else if (step === 2 && password) {
                setStep(3);
            } else if (step === 3 && otp) {
                const success = await login(email, password, otp);
                if (success) {
                    toast({
                        title: "Login Successful",
                        description: "Welcome back to Project Saaransh!"
                    });
                    navigate('/'); 
                } else {
                    setError("Invalid credentials or OTP. Please try again.");
                    toast({
                        title: "Login Failed",
                        description: "Invalid credentials. Please try again.",
                        variant: "destructive"
                    });
                }
            }
        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            toast({
                title: "Error",
                description: "An error occurred during login.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Sign In</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter your official credentials to access the portal.</p>
            {error && <p className="text-red-500 text-sm text-center mb-4 bg-red-50 p-3 rounded-lg">{error}</p>}
            <form onSubmit={handleNext} className="space-y-5">
                {step === 1 && (
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2 text-left" htmlFor="email">Email Address</label>
                        <div className="relative">
                            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-10 pr-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                        </div>
                    </div>
                )}
                {step === 2 && (
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2 text-left" htmlFor="password">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-10 pr-10 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                required
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>
                )}
                {step === 3 && (
                    <div>
                        <label className="block text-slate-700 text-sm font-bold mb-2 text-left" htmlFor="otp">One-Time Password (OTP)</label>
                        <p className="text-xs text-slate-500 mb-2 text-left">An OTP has been sent to your email. (Hint: 123456)</p>
                        <input
                            id="otp"
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                            className="shadow-sm appearance-none border rounded-lg w-full py-2.5 px-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter 6-digit OTP"
                            required
                        />
                    </div>
                )}
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full disabled:bg-blue-400"
                    disabled={isLoading}
                >
                    {isLoading ? "Processing..." : step === 1 ? "Continue" : step === 2 ? "Sign In" : "Verify & Sign In"}
                </button>
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setAuthMode('forgotPassword')}
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                        Forgot Password?
                    </button>
                </div>
            </form>
        </>
    );
};

// Helper component for the Forgot Password panel.
const ForgotPasswordPanel = ({ setAuthMode }) => {
    const { toast } = useToast();
    const [email, setEmail] = useState('ishaan.saxena@mca.gov.in');

    const handleForgotPassword = (e) => {
        e.preventDefault();
        toast({
            title: "Password Reset",
            description: `Password reset instructions have been sent to ${email}.`,
        });
    };

    return (
        <>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Reset Password</h2>
            <p className="text-slate-500 mb-6 text-sm">Enter your email to receive reset instructions.</p>
            <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                    <label className="block text-slate-700 text-sm font-bold mb-2 text-left" htmlFor="email-forgot">Email Address</label>
                    <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <input
                            id="email-forgot"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="shadow-sm appearance-none border rounded-lg w-full py-2.5 pl-10 pr-3 text-slate-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-lg focus:outline-none focus:shadow-outline w-full" type="submit">
                    Send Reset Instructions
                </button>
                <div className="text-center">
                    <button
                        type="button"
                        onClick={() => setAuthMode('login')}
                        className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                    >
                        Back to Sign In
                    </button>
                </div>
            </form>
        </>
    );
};


// Main AuthPage component that renders the layout and switches between panels.
const AuthPage = () => {
    const [authMode, setAuthMode] = useState('login'); 

    const renderAuthContent = () => {
        if (authMode === 'login') {
            return <LoginPanel setAuthMode={setAuthMode} />;
        }
        if (authMode === 'forgotPassword') {
            return <ForgotPasswordPanel setAuthMode={setAuthMode} />;
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" style={{ backgroundImage: `url('https://www.toptal.com/designers/subtlepatterns/uploads/double-bubble-outline.png')` }}>
            <div className="w-full max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 bg-white shadow-2xl rounded-2xl overflow-hidden">
                <div className="p-8 sm:p-12 flex flex-col justify-between">
                    <div className="text-center">
                        <img src="https://raw.githubusercontent.com/Ishaan145/Saaransh/main/saaransh-app/public/mca.png" alt="MCA Emblem" className="h-20 mb-6 mx-auto" />
                        {renderAuthContent()}
                    </div>
                    <div className="mt-8">
                        <h3 className="text-center text-sm font-semibold text-slate-600 mb-3">Quick Government Portals</h3>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-xs text-slate-500">
                            <a href="https://www.pmindia.gov.in/en/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">PMO India</a>
                            <span className="select-none">|</span>
                            <a href="https://www.mca.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">Ministry of Corporate Affairs</a>
                            <span className="select-none">|</span>
                            <a href="https://presidentofindia.nic.in/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">President of India</a>
                            <span className="select-none">|</span>
                            <a href="https://pgportal.gov.in/" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-blue-600">Public Grievance Portal</a>
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block bg-slate-800 p-12 text-white bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1554224155-169544351720?q=80&w=2070&auto=format&fit=crop')` }}>
                    <div className="bg-slate-900 bg-opacity-60 p-8 rounded-lg flex flex-col h-full">
                        <h2 className="text-3xl font-bold mb-4 text-white">Project Saaransh</h2>
                        <p className="text-slate-200 mb-8">AI-Powered analysis for transparent and responsive corporate governance.</p>
                        <div className="space-y-6">
                            <div className="flex items-start">
                                <CheckCircle className="h-6 w-6 text-emerald-400 mr-3 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-white">Comprehensive Insights</h3>
                                    <p className="text-slate-300 text-sm">Leverage state-of-the-art AI to understand public sentiment, stance, and key themes from thousands of submissions instantly.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <Shield className="h-6 w-6 text-emerald-400 mr-3 flex-shrink-0 mt-1" />
                                <div>
                                    <h3 className="font-semibold text-white">Secure & Auditable</h3>
                                    <p className="text-slate-300 text-sm">Built for government use with end-to-end security, access controls, and a fully auditable analysis trail.</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-auto text-center">
                            <img src="https://raw.githubusercontent.com/Ishaan145/Saaransh/main/saaransh-app/public/mca1.png" alt="Digital India Logo" className="mx-auto h-16" />
                            <p className="text-xs text-slate-400 mt-4">&copy; 2025 Ministry of Corporate Affairs</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;