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
} from '@angular/fire/firestore';
import { Router } from '@angular/router';

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
        await this.fetchUserRole(user.phoneNumber!);
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
          this.router.navigate(['/error']); // Optional: Redirect to error page
        }
      } else {
        this.clearAuthState();
      }
    });
  }

  async fetchUserRole(phoneNumber: string) {
    const userRef = collection(this.firestore, 'users');
    const q = query(userRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const userData = querySnapshot.docs[0].data();
      this.role = userData['role'];
      this.city = userData['city'];
      this.district = userData['district'];
      this.userInfo = {
        name: userData['name'] + ' ' + userData['surname'],
        email: userData['email'],
      };
    } else {
      console.error('User not found in Firestore.');
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
    const userRef = collection(this.firestore, 'users');
    const q = query(userRef, where('phoneNumber', '==', phoneNumber));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.length > 0;
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
