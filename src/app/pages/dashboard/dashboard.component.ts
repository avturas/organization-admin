import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

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
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit, OnDestroy {
  isDashboardRoute: boolean = false;
  private isConfirmedSub: Subscription = new Subscription();
  public isConfirmed = true;
  public isAdmin = false;
  public phoneNumber = '';
  public drawerType: 'side' | 'over' | 'push' = 'side';
  constructor(
    public authService: AuthService,
    public router: Router,
    public dialog: MatDialog,
    private responsive: BreakpointObserver
  ) {}

  ngOnInit(): void {
    this.isConfirmedSub = this.authService.isConfirmedChanged.subscribe(
      async (confirmed) => {
        this.isConfirmed = confirmed.confirmed;
        if (!this.isConfirmed) {
          this.openDialog();
        }
        const user = await this.authService.getUser();
        this.phoneNumber = user?.phoneNumber || '';
      }
    );

    this.responsive.observe(Breakpoints.Handset).subscribe((result) => {
      if (result.matches) {
        this.drawerType = 'over';
      }
    });
  }

  openDialog() {
    const dialogRef = this.dialog.open(DialogContentExampleDialog, {
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.logOut();
      }
    });
  }

  ngOnDestroy(): void {
    this.isConfirmedSub.unsubscribe();
  }

  logOut() {
    this.authService.logout();
    this.router.navigate(['/signIn']);
  }
}

@Component({
  selector: 'dialog-is-not-confirmed',
  templateUrl: 'dialog-is-not-confirmed.html',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
})
export class DialogContentExampleDialog {}
