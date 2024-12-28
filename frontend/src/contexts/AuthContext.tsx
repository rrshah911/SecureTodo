import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthTokens, User, SignInInput, SignUpInput, ConfirmSignUpInput } from '../types/auth';
import { authApi } from '../services/api';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: (data: SignInInput) => Promise<void>;
    signUp: (data: SignUpInput) => Promise<string>;
    confirmSignUp: (data: ConfirmSignUpInput) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing token and validate it
        const checkAuth = async () => {
            const token = localStorage.getItem('accessToken');
            if (token) {
                try {
                    // Here you would typically validate the token
                    // For now, we'll just set a basic user object
                    setUser({
                        email: localStorage.getItem('userEmail') || '',
                        sub: localStorage.getItem('userSub') || '',
                    });
                } catch (error) {
                    console.error('Auth check failed:', error);
                    await logout();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const signIn = async (data: SignInInput) => {
        try {
            const response = await authApi.signIn(data);
            const { AccessToken, IdToken, RefreshToken } = response.data;
            
            localStorage.setItem('accessToken', AccessToken);
            localStorage.setItem('idToken', IdToken);
            localStorage.setItem('refreshToken', RefreshToken);
            localStorage.setItem('userEmail', data.email);
            
            // In a real app, you would decode the JWT token to get user info
            setUser({
                email: data.email,
                sub: 'placeholder-sub', // This should come from the decoded token
            });
        } catch (error) {
            console.error('Sign in failed:', error);
            throw error;
        }
    };

    const signUp = async (data: SignUpInput) => {
        try {
            const response = await authApi.signUp(data);
            return response.data.userSub;
        } catch (error) {
            console.error('Sign up failed:', error);
            throw error;
        }
    };

    const confirmSignUp = async (data: ConfirmSignUpInput) => {
        try {
            await authApi.confirmSignUp(data);
        } catch (error) {
            console.error('Confirm sign up failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('idToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userSub');
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                signIn,
                signUp,
                confirmSignUp,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 