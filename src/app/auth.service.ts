import { Injectable } from '@angular/core';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  User,
} from '@angular/fire/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  Firestore,
  Query,
} from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { getFunctions, httpsCallable } from '@angular/fire/functions';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth = getAuth();
  private firestore: Firestore = getFirestore();
  private recaptchaVerifier!: RecaptchaVerifier;
  private confirmationResult: any;

  user: User | null = null;
  private isAuthenticated = false;
  private isConfirmed = false;
  private authSecretKey = 'Bearer Token';
  private authSecret = '';

  public role: string | null = null;
  public city: string | null = null;
  public district: string | null = null;
  public userInfo: {
    name: string;
    email: string;
  } = {
    name: '',
    email: '',
  };

  constructor(private router: Router) {
    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        await this.callSyncCustomClaimsClaimsFunction();
        await this.fetchUserRoleFromToken();
        this.user = user;
        this.setAuthSecret(await user.getIdToken());
        this.isAuthenticated = true;
        localStorage.setItem(this.authSecretKey, this.authSecret);

        try {
          const confirmed = await this.checkUserConfirmation(user.phoneNumber!);
          this.setIsConfirmed(confirmed);

          if (confirmed) {
            this.router.navigate(['/dashboard']);
          } else {
            this.router.navigate(['/blocked']);
          }
        } catch (error) {
          console.error('Error checking user confirmation:', error);
          this.router.navigate(['/error']);
        }
      } else {
        this.clearAuthState();
      }
    });
  }

  private async callSyncCustomClaimsClaimsFunction(): Promise<void> {
    const alreadySynced = localStorage.getItem('claimsSynced');
    if (alreadySynced) {
      return;
    }

    try {
      const functions = getFunctions();
      const setClaims = httpsCallable(functions, 'syncCustomClaims');
      await setClaims();

      await this.auth.currentUser?.getIdToken(true);

      localStorage.setItem('claimsSynced', 'true');
    } catch (error) {
      console.error('Error syncing custom claims:', error);
    }
  }

  private async fetchUserDisplayInfo(): Promise<void> {
    const phoneNumber = this.auth.currentUser?.phoneNumber;
    if (!phoneNumber) return;

    try {
      const q = this.buildScopedUserQuery(phoneNumber);
      const snapshot = await getDocs(q);

      const userData = snapshot.docs[0]?.data();

      if (userData) {
        this.userInfo = {
          name: `${userData['name']} ${userData['surname']}`,
          email: userData['email'],
        };
      } else {
        console.error('User not found in Firestore.');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  async fetchUserRoleFromToken(): Promise<void> {
    const idTokenResult = await this.auth.currentUser?.getIdTokenResult(true);
    const claims = idTokenResult?.claims;

    if (claims) {
      this.role = (claims['role'] as string) || null;
      this.city = typeof claims['city'] === 'string' ? claims['city'] : null;
      this.district =
        typeof claims['district'] === 'string' || claims['district'] === null
          ? claims['district']
          : null;

      await this.fetchUserDisplayInfo();
    } else {
      console.error('No custom claims found in ID token');
    }
  }

  getUserInfo() {
    return this.userInfo;
  }

  getUserRole(): string | null {
    return this.role;
  }

  getUserCity(): string | null {
    return this.city;
  }

  getUserDistrict(): string | null {
    return this.district;
  }

  async sendOtp(phoneNumber: string): Promise<void> {
    try {
      this.confirmationResult = await signInWithPhoneNumber(
        this.auth,
        '+90' + phoneNumber,
        this.recaptchaVerifier
      );
      console.log('OTP sent');
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;
    }
  }

  async verifyOtp(otp: string): Promise<void> {
    if (!this.confirmationResult) {
      throw new Error(
        'No confirmation result available. Please send OTP again.'
      );
    }
    try {
      await this.confirmationResult.confirm(otp);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      throw error;
    }
  }

  async checkUserConfirmation(phoneNumber: string): Promise<boolean> {
    try {
      const q = this.buildScopedUserQuery(phoneNumber);
      const snapshot = await getDocs(q);
      return snapshot.docs.length > 0;
    } catch (error) {
      console.error('Error checking user confirmation:', error);
      return false;
    }
  }

  private buildScopedUserQuery(phoneNumber: string): Query {
    const userRef = collection(this.firestore, 'users');

    if (this.role === 'headquarters') {
      return query(userRef, where('phoneNumber', '==', phoneNumber));
    }

    if (this.role === 'city' && this.city) {
      return query(
        userRef,
        where('phoneNumber', '==', phoneNumber),
        where('city', '==', this.city)
      );
    }

    if (this.role === 'district' && this.city && this.district) {
      return query(
        userRef,
        where('phoneNumber', '==', phoneNumber),
        where('city', '==', this.city),
        where('district', '==', this.district)
      );
    }

    throw new Error('Invalid role or missing city/district in claims');
  }

  setIsConfirmed(confirmed: boolean): void {
    this.isConfirmed = confirmed;
  }

  getIsConfirmed(): boolean {
    return this.isConfirmed;
  }

  setAuthSecret(secret: string): void {
    this.authSecret = secret;
  }

  getAuthSecret(): string {
    return this.authSecret;
  }

  getIsAuthenticated(): boolean {
    return this.isAuthenticated;
  }

  clearAuthState(): void {
    localStorage.removeItem(this.authSecretKey);
    localStorage.removeItem('claimsSynced');
    this.isAuthenticated = false;
    this.isConfirmed = false;
    this.user = null;
  }

  async getUser(): Promise<User | null> {
    return this.user;
  }

  async logout(): Promise<void> {
    this.clearAuthState();
    await this.auth.signOut();
    this.router.navigate(['/signIn']);
  }

  initializeRecaptcha(containerId: string): void {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA solved');
      },
    });
  }
}
