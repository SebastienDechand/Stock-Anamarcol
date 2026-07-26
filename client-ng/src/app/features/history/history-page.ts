import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  OnInit,
  signal,
  ViewChild,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { combineLatest } from 'rxjs';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  LucideAngularModule,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Trash2,
  AlertTriangle,
  LogIn,
  Plus,
  Pencil,
  Upload,
  ArrowRightLeft,
  Package,
} from 'lucide-angular';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { HistoryFacade } from './store/facade/history.facade';
import { Spinner } from '../../shared/components/spinner/spinner';
import { PageHero } from '../../shared/components/page-hero/page-hero';
import { AuditEvent } from '../../shared/models/audit/audit.model';
import {
  ACTION_MAP,
  DEFAULT_ACTION,
  ENTITY_MAP,
} from '../../shared/constants/audit/audit.constants';
import { LanguageService } from '../../core/services/language/language.service';
import { resolveLocale } from '../../shared/utils/date/date.utils';

const PAGE_LIMIT = 30;

function isQuantityOnlyUpdate(event: AuditEvent): boolean {
  if (event.action !== 'update') return false;
  if (event.details?.['field']) {
    const field = String(event.details['field']).toLowerCase();
    return field === 'quantity';
  }
  if (event.details?.['changes'] && typeof event.details['changes'] === 'object') {
    const fields = Object.keys(event.details['changes'] as Record<string, unknown>);
    return (
      fields.length > 0 &&
      fields.every((fieldName) => String(fieldName).toLowerCase() === 'quantity')
    );
  }
  return false;
}

@Component({
  selector: 'app-history-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe, LucideAngularModule, Spinner, PageHero],
  templateUrl: './history-page.html',
  styleUrl: './history-page.scss',
})
export class HistoryPage implements OnInit {
  private authFacade = inject(AuthFacade);
  private facade = inject(HistoryFacade);
  private translate = inject(TranslateService);
  private languageService = inject(LanguageService);
  private destroyRef = inject(DestroyRef);

  @ViewChild('userDropdownEl') userDropdownEl?: ElementRef<HTMLElement>;

  readonly clockIcon = Clock;
  readonly search = Search;
  readonly chevLeft = ChevronLeft;
  readonly chevRight = ChevronRight;
  readonly chevDown = ChevronDown;
  readonly xIcon = X;
  readonly trash2 = Trash2;
  readonly alertTriangle = AlertTriangle;

  readonly actionMap = ACTION_MAP;
  readonly actionKeys = ['login', 'create', 'update', 'delete', 'move', 'upload'];

  readonly actionIconMap: Record<string, unknown> = {
    login: LogIn,
    create: Plus,
    delete: Trash2,
    update: Pencil,
    move: ArrowRightLeft,
    upload: Upload,
  };
  readonly defaultActionIcon = Package;

  isAdmin$ = this.authFacade.isAdmin$;
  isSuperadmin$ = this.authFacade.isSuperadmin$;

  allEvents = signal<AuditEvent[]>([]);
  isLoading = signal(false);
  searchTerm = signal('');
  activeFilter = signal('all');
  selectedUsers = signal<string[]>([]);
  userDropdownOpen = signal(false);
  users = signal<{ _id: string; username: string }[]>([]);
  isPurging = signal(false);
  showPurgeModal = signal(false);

  currentPage = signal(1);
  totalPages = signal(1);
  total = signal(0);
  filteredTotal = signal(0);

  ngOnInit(): void {
    this.facade.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((events) => {
      this.allEvents.set(events);
    });
    this.facade.users$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((users) => {
      this.users.set(users);
    });
    this.facade.isLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isLoading) => {
      this.isLoading.set(isLoading);
    });
    this.facade.isPurging$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isPurging) => {
      this.isPurging.set(isPurging);
    });

    combineLatest([this.authFacade.isAdmin$, this.authFacade.isSuperadmin$])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(([isAdmin, isSuperadmin]) => {
        if (isAdmin || isSuperadmin) this.facade.loadEvents();
      });
    this.facade.loadUsers();
  }

  get filteredEvents(): AuditEvent[] {
    const query = this.searchTerm().toLowerCase().trim();
    const filter = this.activeFilter();
    const selectedUsers = this.selectedUsers();

    return this.allEvents()
      .filter((event) => !!event.userName)
      .filter((event) => !isQuantityOnlyUpdate(event))
      .filter((event) => {
        if (filter === 'upload')
          return ['upload', 'upload_document', 'delete_document'].includes(event.action);
        if (filter !== 'all') return event.action === filter;
        return true;
      })
      .filter((event) => selectedUsers.length === 0 || selectedUsers.includes(event.userName ?? ''))
      .filter((event) => {
        if (!query) return true;
        return (
          (event.userName ?? '').toLowerCase().includes(query) ||
          event.entity.toLowerCase().includes(query) ||
          this.describeEvent(event).toLowerCase().includes(query)
        );
      });
  }

  describe(event: AuditEvent): string {
    return this.describeEvent(event);
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const mins = Math.floor((now.getTime() - d.getTime()) / 60000);
    if (mins < 1) return this.translate.instant('HISTORY.DATE_NOW');
    if (mins < 60) return this.translate.instant('HISTORY.DATE_MINUTES_AGO', { n: mins });
    const hours = Math.floor(mins / 60);
    if (hours < 24) return this.translate.instant('HISTORY.DATE_HOURS_AGO', { n: hours });
    return d.toLocaleDateString(resolveLocale(this.languageService.current), {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  actionLabel(action: string): string {
    return ACTION_MAP[action]?.label ?? action;
  }

  filterTitle(key: string): string {
    return this.translate.instant('HISTORY.FILTER_BY_ACTION', {
      action: this.translate.instant(this.actionLabel(key)),
    });
  }

  toggleUser(username: string): void {
    this.selectedUsers.update((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username],
    );
  }

  clearUsers(): void {
    this.selectedUsers.set([]);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMousedown(event: MouseEvent): void {
    if (!this.userDropdownOpen()) return;
    const el = this.userDropdownEl?.nativeElement;
    if (el && !el.contains(event.target as Node)) {
      this.userDropdownOpen.set(false);
    }
  }

  purge(): void {
    this.facade.purge();
    this.showPurgeModal.set(false);
  }

  private describeEvent(event: AuditEvent): string {
    const entityKey = ENTITY_MAP[event.entity]?.label;
    const entity = entityKey ? this.translate.instant(entityKey).toLowerCase() : event.entity;
    const entityName =
      (event.details?.['entityName'] as string | undefined) ??
      (event.details?.['name'] as string | undefined);
    const name = entityName ? ` "${entityName}"` : '';

    if (event.action === 'login') return this.translate.instant('HISTORY.DESC_LOGIN');
    if (event.action === 'create')
      return this.translate.instant('HISTORY.DESC_CREATE', { entity, name });
    if (event.action === 'delete') {
      const deleteName = entityName ?? (event.details?.['oldValue'] as string | undefined);
      return deleteName
        ? this.translate.instant('HISTORY.DESC_DELETE', { entity, name: ` "${deleteName}"` })
        : this.translate.instant('HISTORY.DESC_DELETE_ANON', { entity });
    }
    if (event.action === 'upload') return this.translate.instant('HISTORY.DESC_UPLOAD', { name });
    if (event.action === 'upload_document')
      return this.translate.instant('HISTORY.DESC_UPLOAD_DOC', { name });
    if (event.action === 'delete_document')
      return this.translate.instant('HISTORY.DESC_DELETE_DOC', { name });
    if (event.action === 'move') return this.translate.instant('HISTORY.DESC_MOVE', { name });
    if (event.action === 'quantity_change' && event.details) {
      return this.translate.instant('HISTORY.DESC_QTY', {
        name,
        old: event.details['oldValue'],
        new: event.details['newValue'],
      });
    }
    if (event.action === 'update' && event.details?.['changes']) {
      const fields = Object.keys(event.details['changes'] as Record<string, unknown>);
      return this.translate.instant('HISTORY.DESC_UPDATE_FIELDS', {
        entity,
        name,
        fields: fields.join(', '),
      });
    }
    if (event.action === 'update' && event.details?.['field']) {
      return this.translate.instant('HISTORY.DESC_UPDATE_FIELD', {
        field: String(event.details['field']),
        name,
      });
    }
    return this.translate.instant('HISTORY.DESC_DEFAULT', { action: event.action, entity });
  }
}
