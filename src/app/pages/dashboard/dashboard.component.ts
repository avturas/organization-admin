import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth.service';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatTooltipModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatMenuModule,
    MatSidenavModule,
    RouterModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    CommonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  public phoneNumber = '';
  public drawerType: 'side' | 'over' | 'push' = 'side';
  public role: string | null = null;
  public city: string | null = null;
  public district: string | null = null;

  constructor(
    public authService: AuthService,
    public router: Router,
    private responsive: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.initializeUser();

    this.role = this.authService.getUserRole();
    this.city = this.authService.getUserCity();
    this.district = this.authService.getUserDistrict();

    this.responsive.observe(Breakpoints.Handset).subscribe((result) => {
      this.drawerType = result.matches ? 'over' : 'side';
    });
  }

  async initializeUser() {
    try {
      const user = await this.authService.getUser();
      this.phoneNumber = user?.phoneNumber || '';
    } catch (error) {
      console.error('Error initializing user:', error);
      this.router.navigate(['/signIn']);
    }
  }

  logOut(): void {
    this.authService.logout();
    this.router.navigate(['/signIn']);
  }

  ngOnDestroy(): void {
    // No active subscriptions to clean up
  }
}
