import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  standalone: true,
  template: `
    <div class="spinner-overlay" [class.spinner-overlay--inline]="inline">
      <div class="spinner"></div>
      @if (message) {
        <p class="spinner-message">{{ message }}</p>
      }
    </div>
  `,
  styleUrl: './spinner.scss',
})
export class Spinner {
  @Input() message = '';
  @Input() inline = false;
}
