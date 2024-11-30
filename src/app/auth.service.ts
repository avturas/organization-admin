import { Injectable } from '@angular/core';
import {
  getAuth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from '@angular/fire/auth';
import { getDocs, getFirestore } from '@angular/fire/firestore';
import { collection, query, where } from 'firebase/firestore';
import { Subject } from 'rxjs';
import { User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  auth = getAuth();
  user: User | undefined;
  private recaptchaVerifier!: RecaptchaVerifier;
  private confirmationResult: any;

  private isAuthenticated = false;
  private isConfirmed = false;
  private authSecretKey = 'Bearer Token';
  private authSecret = '';
  public isConfirmedChanged = new Subject<{
    confirmed: boolean;
  }>();

  constructor() {
    this.isAuthenticated = !!localStorage.getItem(this.authSecretKey);
    this.authSecret = localStorage.getItem(this.authSecretKey) || '';

    this.auth.onAuthStateChanged(async (user) => {
      if (user) {
        this.user = user;
        this.setAuthSecret(await this.user.getIdToken());
        this.isAuthenticated = true;
        localStorage.setItem(this.authSecretKey, this.authSecret);
        const userRef = collection(getFirestore(), 'users');
        const q = query(
          userRef,
          where('phoneNumber', '==', this.user.phoneNumber)
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.docs.length === 0) {
          this.setIsConfirmed(false);
          this.isConfirmedChanged.next({
            confirmed: false,
          });
        }
        querySnapshot.forEach(() => {
          this.setIsConfirmed(true);

          this.isConfirmedChanged.next({
            confirmed: true,
          });
        });
      } else {
        localStorage.removeItem(this.authSecretKey);
        this.isAuthenticated = false;
      }
    });
  }

  initializeRecaptcha(containerId: string) {
    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, containerId, {
      size: 'invisible',
      callback: (response: any) => {
        console.log('reCAPTCHA solved');
      },
    });
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
      console.error('Error sending OTP', error);
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
      throw error;
    }
  }

  setIsConfirmed(confirmed: boolean) {
    this.isConfirmed = confirmed;
  }

  getIsConfirmed() {
    return this.isConfirmed;
  }

  setAuthSecret(secret: string) {
    this.authSecret = secret;
  }

  getAuthSecret() {
    return this.authSecret;
  }

  getIsAuthenticated() {
    return this.isAuthenticated;
  }

  async getUser() {
    return this.user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.authSecretKey);
    this.isAuthenticated = false;
    await this.auth.signOut();
  }
}
