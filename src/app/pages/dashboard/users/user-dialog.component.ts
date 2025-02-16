import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { CITIES } from '../../../shared/cities';
import { DISTRICTS } from '../../../shared/districts';
import { UserData } from './users.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { AuthService } from '../../../auth.service';

const ROLE_TEXTS = {
  headquarters: 'GENEL MERKEZ',
  city: 'İL',
  district: 'İLÇE',
};

@Component({
    selector: 'app-user-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDialogModule,
    ],
    templateUrl: './user-dialog.html',
    styleUrl: './user-dialog.scss'
})
export class UserDialog implements OnInit {
  userForm!: FormGroup;
  ROLE_TEXTS = ROLE_TEXTS;
  availableRoles: string[] = [];
  availableCities = Object.entries(CITIES).map(([key, value]) => ({
    key,
    value,
  }));
  filteredDistricts: string[] = [];
  showCityField = false;
  showDistrictField = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<UserDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UserData,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    // Set available roles based on the current user's role
    if (currentUserRole === 'headquarters') {
      this.availableRoles = ['headquarters', 'city', 'district'];
    } else if (currentUserRole === 'city') {
      this.availableRoles = ['city', 'district'];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
    } else if (currentUserRole === 'district') {
      this.availableRoles = ['district'];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    }

    // Initialize form
    this.userForm = this.fb.group({
      uid: [this.data?.uid || ''],
      name: [this.data?.name || '', Validators.required],
      surname: [this.data?.surname || '', Validators.required],
      email: [this.data?.email || '', [Validators.required, Validators.email]],
      phoneNumber: [this.data?.phoneNumber || '', Validators.required],
      role: [
        this.data?.role || (currentUserRole === 'district' ? 'district' : ''),
        Validators.required,
      ],
      city: [this.data?.city || currentUserCity || ''],
      district: [this.data?.district || currentUserDistrict || ''],
    });

    if (this.data?.city) {
      this.onCityChange(this.data.city);
    }

    this.onRoleChange(this.userForm.controls['role'].value);

    this.userForm.controls['role'].valueChanges.subscribe((role) => {
      this.onRoleChange(role);
    });
  }

  onRoleChange(selectedRole: string): void {
    this.showCityField = selectedRole === 'city' || selectedRole === 'district';
    this.showDistrictField = selectedRole === 'district';

    if (!this.showCityField) {
      this.userForm.controls['city'].reset();
    }
    if (!this.showDistrictField) {
      this.userForm.controls['district'].reset();
    }

    this.adjustFieldValidators(selectedRole);
  }

  adjustFieldValidators(role: string): void {
    const cityControl = this.userForm.controls['city'];
    const districtControl = this.userForm.controls['district'];

    if (role === 'headquarters') {
      cityControl.clearValidators();
      districtControl.clearValidators();
    } else if (role === 'city') {
      cityControl.setValidators(Validators.required);
      districtControl.clearValidators();
    } else if (role === 'district') {
      cityControl.setValidators(Validators.required);
      districtControl.setValidators(Validators.required);
    }

    cityControl.updateValueAndValidity();
    districtControl.updateValueAndValidity();
  }

  getRoleText = (role: string) => {
    return ROLE_TEXTS[role as keyof typeof ROLE_TEXTS] || 'Bilinmeyen Rol';
  };

  onCityChange(selectedCity: string): void {
    const currentUserRole = this.authService.getUserRole();
    if (currentUserRole === 'district') {
      return;
    }

    const cityName = this.availableCities.find(
      (city) => city.value === selectedCity
    )?.value;

    this.filteredDistricts = cityName ? DISTRICTS[cityName] || [] : [];

    if (
      !this.filteredDistricts.includes(this.userForm.controls['district'].value)
    ) {
      this.userForm.controls['district'].reset();
    }
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      this.dialogRef.close(this.userForm.value);
    }
  }
}
