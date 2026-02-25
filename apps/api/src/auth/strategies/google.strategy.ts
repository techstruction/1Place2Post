import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID || 'not-set',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'not-set',
            callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:35763/api/auth/google/callback',
            scope: ['email', 'profile'],
        });
    }

    async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
        const { name, emails, photos } = profile;
        const user = {
            email: emails[0].value,
            firstName: name?.givenName,
            lastName: name?.familyName,
            picture: photos && photos.length > 0 ? photos[0].value : undefined,
            accessToken,
        };
        done(null, user);
    }
}
