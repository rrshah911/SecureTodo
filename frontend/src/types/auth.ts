export interface AuthTokens {
    AccessToken: string;
    IdToken: string;
    RefreshToken: string;
    ExpiresIn: number;
}

export interface SignUpInput {
    email: string;
    password: string;
}

export interface SignInInput {
    email: string;
    password: string;
}

export interface ConfirmSignUpInput {
    email: string;
    code: string;
}

export interface User {
    email: string;
    sub: string;  // Cognito User ID
} 