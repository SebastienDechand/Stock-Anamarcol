import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class DatePickerRegistry {
  private activeId = signal<symbol | null>(null);

  isActive(id: symbol): boolean {
    return this.activeId() === id;
  }

  open(id: symbol): void {
    this.activeId.set(id);
  }

  close(id: symbol): void {
    if (this.activeId() === id) this.activeId.set(null);
  }

  closeAll(): void {
    this.activeId.set(null);
  }
}
