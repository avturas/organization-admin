import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../auth.service';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-sign-in',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    CommonModule,
    MatProgressBarModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements AfterViewInit, OnDestroy {
  phoneNumber: string = '';
  otp: string = '';
  error = '';
  user: any;
  otpSent = false;
  isLoading = false;

  constructor(private authService: AuthService, public router: Router) {}

  ngAfterViewInit(): void {
    this.authService.initializeRecaptcha('recaptcha-container');
  }

  ngOnDestroy(): void {
    this.authService.destroyRecaptcha();
  }

  async sendOtp() {
    if (!this.phoneNumber) {
      alert('Please enter a valid phone number');
      return;
    }
    this.isLoading = true;
    try {
      await this.authService.sendOtp(this.phoneNumber);
      this.otpSent = true;
    } catch (e) {
      this.error = 'Bir Hata Oluştu';
    } finally {
      this.isLoading = false;
    }
  }

  async verifyOtp() {
    if (!this.otp) {
      alert('Lütfen SMS Şifresini Giriniz');
      return;
    }
    this.isLoading = true;

    try {
      await this.authService.verifyOtp(this.otp);
      this.router.navigate(['/']);
    } catch (e) {
      this.error = 'Bir Hata Oluştu';
    } finally {
      this.isLoading = false;
    }
  }
}
