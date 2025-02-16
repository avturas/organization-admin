import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CITIES } from '../../../shared/cities';
import { DISTRICTS } from '../../../shared/districts';
import { AuthService } from '../../../auth.service';

const TYPE_TEXTS = {
  headquarters: 'Genel Merkez',
  city: 'İl',
  district: 'İlçe',
};

export interface ManagementBoardData {
  id?: string;
  name: string;
  role: string;
  type: string;
  city?: string;
  district?: string;
}

@Component({
    selector: 'app-management-board-dialog',
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
    templateUrl: './management-board-dialog.component.html',
    styleUrls: ['./management-board-dialog.component.scss']
})
export class ManagementBoardDialogComponent implements OnInit {
  managementBoardForm!: FormGroup;
  TYPE_TEXTS = TYPE_TEXTS;
  availableTypes: string[] = [];
  availableCities = Object.entries(CITIES).map(([key, value]) => ({
    key,
    value,
  }));
  filteredDistricts: string[] = [];
  showCityField = false;
  showDistrictField = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<ManagementBoardDialogComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA)
    public data: { member: ManagementBoardData; readonly: boolean }
  ) {}

  ngOnInit(): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (currentUserRole === 'headquarters') {
      this.availableTypes = ['headquarters', 'city', 'district'];
    } else if (currentUserRole === 'city') {
      this.availableTypes = ['city', 'district'];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
    } else if (currentUserRole === 'district') {
      this.availableTypes = ['district'];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    }

    this.managementBoardForm = this.fb.group({
      id: [this.data?.member.id || ''],
      name: [this.data?.member?.name || '', Validators.required],
      role: [
        this.data?.member?.role || 'Yönetim Kurulu Üyesi',
        Validators.required,
      ],
      type: [this.data?.member?.type || '', Validators.required],
      city: [this.data?.member?.city || currentUserCity || ''],
      district: [this.data?.member?.district || currentUserDistrict || ''],
    });

    this.onTypeChange(this.managementBoardForm.controls['type'].value);

    this.managementBoardForm.controls['type'].valueChanges.subscribe((type) => {
      this.onTypeChange(type);
    });
  }

  getRoleText = (role: string) => {
    return TYPE_TEXTS[role as keyof typeof TYPE_TEXTS] || 'Bilinmeyen Rol';
  };

  onTypeChange(selectedType: string): void {
    this.showCityField = selectedType === 'city' || selectedType === 'district';
    this.showDistrictField = selectedType === 'district';

    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (!this.showCityField) {
      this.managementBoardForm.controls['city'].reset();
    }
    if (!this.showDistrictField) {
      this.managementBoardForm.controls['district'].reset();
    }

    if (currentUserRole === 'district' && selectedType === 'district') {
      this.managementBoardForm.controls['city'].setValue(currentUserCity);
      this.managementBoardForm.controls['district'].setValue(
        currentUserDistrict
      );
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    } else if (
      this.showCityField &&
      this.managementBoardForm.controls['city'].value
    ) {
      this.onCityChange(this.managementBoardForm.controls['city'].value);
    }
  }

  onCityChange(selectedCity: string): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (currentUserRole === 'district') {
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
      this.managementBoardForm.controls['district'].setValue(
        currentUserDistrict
      );
      return;
    }

    const cityName = this.availableCities.find(
      (city) => city.value === selectedCity
    )?.value;

    this.filteredDistricts = cityName ? DISTRICTS[cityName] || [] : [];
    this.managementBoardForm.controls['district'].reset();
  }

  onSubmit(): void {
    if (this.managementBoardForm.valid) {
      this.dialogRef.close(this.managementBoardForm.value);
    }
  }
}
