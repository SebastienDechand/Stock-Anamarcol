import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule, Package, ChevronLeft, ChevronRight } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '../../../store/auth/facade/auth.facade';
import { UiFacade } from '../../../store/ui/facade/ui.facade';
import { combineLatest, map } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, LucideAngularModule, TranslatePipe],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Sidebar {
  protected authFacade = inject(AuthFacade);
  protected uiFacade = inject(UiFacade);

  readonly Package = Package;
  readonly ChevronLeft = ChevronLeft;
  readonly ChevronRight = ChevronRight;

  navItems$ = combineLatest([
    this.authFacade.isAdmin$,
    this.authFacade.isHotline$,
    this.authFacade.isMonteur$,
    this.authFacade.isSuperadmin$,
  ]).pipe(
    map(([isAdmin, isHotline, isMonteur, isSuperadmin]) => {
      const items: { path: string; label: string; icon: string; show: boolean }[] = [
        { path: '/home', label: 'NAV.DASHBOARD', icon: 'layout-dashboard', show: true },
        { path: '/items', label: 'NAV.ITEMS', icon: 'package', show: true },
        { path: '/members', label: 'NAV.MEMBERS', icon: 'users', show: true },
        { path: '/contacts', label: 'NAV.CONTACTS', icon: 'book-user', show: true },
        { path: '/profile', label: 'NAV.PROFILE', icon: 'user-circle', show: true },
        { path: '/shipments', label: 'NAV.SHIPMENTS', icon: 'send', show: isHotline },
        {
          path: '/client-files',
          label: 'NAV.CLIENT_FILES',
          icon: 'clipboard-list',
          show: isMonteur,
        },
        { path: '/surveillance', label: 'NAV.SURVEILLANCE', icon: 'monitor', show: isAdmin },
        { path: '/fleet', label: 'NAV.FLEET', icon: 'truck', show: isAdmin },
        { path: '/history', label: 'NAV.HISTORY', icon: 'history', show: isAdmin },
        { path: '/admin/roles', label: 'NAV.ROLES', icon: 'shield-check', show: isSuperadmin },
      ];
      return items.filter((i) => i.show);
    }),
  );

  toggle() {
    this.uiFacade.toggleSidebar();
  }

  closeOnMobile() {
    if (window.innerWidth < 1024) {
      this.uiFacade.setSidebarOpen(false);
    }
  }
}
