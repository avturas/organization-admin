import { Component } from '@angular/core';
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

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatInputModule,
    MatToolbarModule,
    MatFormFieldModule,
    FormsModule,
    CommonModule,
  ],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent {
  phoneNumber: string = '';
  otp: string = '';
  error = '';
  user: any;
  otpSent = false;

  constructor(private authService: AuthService, public router: Router) {}

  ngOnInit(): void {
    this.authService.initializeRecaptcha('recaptcha-container');
  }

  async sendOtp() {
    if (!this.phoneNumber) {
      alert('Please enter a valid phone number');
      return;
    }
    try {
      await this.authService.sendOtp(this.phoneNumber);
      this.otpSent = true;
    } catch (e) {
      this.error = 'Bir Hata Oluştu';
    }
  }

  async verifyOtp() {
    if (!this.otp) {
      alert('Lütfen SMS Şifresini Giriniz');
      return;
    }

    try {
      await this.authService.verifyOtp(this.otp);
      this.router.navigate(['/']);
    } catch (e) {
      this.error = 'Bir Hata Oluştu';
    }
  }
}
