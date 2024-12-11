import { Routes } from '@angular/router';
import { SignInComponent } from './pages/sign-in/sign-in.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { canActivateDashboard, isAlreadySignedIn } from './guards/auth.guard';
import { EventsComponent } from './pages/dashboard/events/events.component';
import { UsersComponent } from './pages/dashboard/users/users.component';
import { MainComponent } from './pages/dashboard/main/main.component';
import { AnnouncementsComponent } from './pages/dashboard/announcements/announcements.component';
import { BlockedComponent } from './pages/blocked/blocked.component';
import { roleGuard } from './guards/role.guard';
import { ExecutiveCommitteeComponent } from './pages/dashboard/executive-committee/executive-committee.component';
import { ManagementBoardComponent } from './pages/dashboard/management-board/management-board.component';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: '/dashboard',
  },
  { path: 'blocked', component: BlockedComponent },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [canActivateDashboard, roleGuard],
    children: [
      {
        path: '',
        component: MainComponent,
      },
      {
        path: 'events',
        component: EventsComponent,
      },
      {
        path: 'users',
        component: UsersComponent,
      },
      {
        path: 'announcements',
        component: AnnouncementsComponent,
      },
      {
        path: 'executive-committee',
        component: ExecutiveCommitteeComponent,
      },
      {
        path: 'management-board',
        component: ManagementBoardComponent,
      },
    ],
  },
  {
    path: 'signIn',
    component: SignInComponent,
    canActivate: [isAlreadySignedIn],
  },
];
