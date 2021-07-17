export interface LoginRequest {
    username: string;
    password: string;
    deviceInfo: DeviceInfo;
}

export interface DeviceInfo {
    browser: string;
    browser_version: string;
    os: string;
    os_version: string;
    userAgent: string;

}

export class LoginRequestResponse {
    token: string;
    refreshToken: string;
    tokenType: string;


    constructor(token: string, refreshToken: string, tokenType: string) {
        this.token = token;
        this.refreshToken = refreshToken;
        this.tokenType = tokenType;
    }
}

export interface RefreshToken {
    refresh_token: string;
}


export interface LoadUserRequest {
    userId: string;
    accessToken: string;
}

