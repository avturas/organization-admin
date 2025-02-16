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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CITIES } from '../../../shared/cities';
import { DISTRICTS } from '../../../shared/districts';
import { AuthService } from '../../../auth.service';

export interface AnnouncementData {
  id?: string;
  title: string;
  description: string;
  date: string;
  audienceType: string;
  city?: string;
  district?: string;
}

@Component({
    selector: 'app-announcement-dialog',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatDialogModule,
        MatDatepickerModule,
        MatNativeDateModule,
    ],
    templateUrl: './announcement-dialog.html',
    styleUrls: ['./announcement-dialog.scss']
})
export class AnnouncementDialogComponent implements OnInit {
  announcementForm!: FormGroup;
  readonlyMode: boolean;
  availableAudienceTypes: { value: string; label: string }[] = [];
  availableCities = Object.entries(CITIES).map(([key, value]) => ({
    key,
    value,
  }));
  filteredDistricts: string[] = [];
  showCityField = false;
  showDistrictField = false;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AnnouncementDialogComponent>,
    private authService: AuthService,
    @Inject(MAT_DIALOG_DATA)
    public data: { announcement: AnnouncementData; readonly: boolean }
  ) {
    this.readonlyMode = data.readonly || false;
  }

  ngOnInit(): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserCity = this.authService.getUserCity();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (currentUserRole === 'headquarters') {
      this.availableAudienceTypes = [
        { value: 'everyone', label: 'Herkes' },
        { value: 'headquarters', label: 'Genel Merkez' },
        { value: 'city', label: 'Şehir' },
        { value: 'district', label: 'İlçe' },
      ];
    } else if (currentUserRole === 'city') {
      this.availableAudienceTypes = [
        { value: 'city', label: 'Şehir' },
        { value: 'district', label: 'İlçe' },
      ];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
    } else if (currentUserRole === 'district') {
      this.availableAudienceTypes = [{ value: 'district', label: 'İlçe' }];
      this.availableCities = this.availableCities.filter(
        (city) => city.value === currentUserCity
      );
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
    }

    this.announcementForm = this.fb.group({
      id: [this.data?.announcement?.id || ''],
      title: [this.data?.announcement?.title || '', Validators.required],
      description: [
        this.data?.announcement?.description || '',
        Validators.required,
      ],
      date: [this.data?.announcement?.date || '', Validators.required],
      audienceType: [
        this.data?.announcement?.audienceType || '',
        Validators.required,
      ],
      city: [this.data?.announcement?.city || currentUserCity || ''],
      district: [
        this.data?.announcement?.district || currentUserDistrict || '',
      ],
    });

    this.onAudienceTypeChange(
      this.announcementForm.controls['audienceType'].value
    );

    this.announcementForm.controls['audienceType'].valueChanges.subscribe(
      (type) => {
        this.onAudienceTypeChange(type);
      }
    );

    if (this.readonlyMode) {
      this.announcementForm.disable();
    }
  }

  onAudienceTypeChange(selectedType: string): void {
    this.showCityField = selectedType === 'city' || selectedType === 'district';
    this.showDistrictField = selectedType === 'district';

    if (!this.showCityField) {
      this.announcementForm.controls['city'].reset();
    }
    if (!this.showDistrictField) {
      this.announcementForm.controls['district'].reset();
    }
  }

  onCityChange(selectedCity: string): void {
    const currentUserRole = this.authService.getUserRole();
    const currentUserDistrict = this.authService.getUserDistrict();

    if (currentUserRole === 'district') {
      this.filteredDistricts = currentUserDistrict ? [currentUserDistrict] : [];
      this.announcementForm.controls['district'].setValue(currentUserDistrict);
      return;
    }

    const cityName = this.availableCities.find(
      (city) => city.value === selectedCity
    )?.value;

    this.filteredDistricts = cityName ? DISTRICTS[cityName] || [] : [];
    this.announcementForm.controls['district'].reset();
  }

  onSubmit(): void {
    if (this.announcementForm.valid) {
      const formValue = { ...this.announcementForm.value };
      if (formValue.date) {
        formValue.date = new Date(formValue.date).toISOString();
      }
      this.dialogRef.close(formValue);
    }
  }
}
