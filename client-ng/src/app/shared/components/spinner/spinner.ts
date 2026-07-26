import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  template: `
    <div class="spinner-overlay" [class.spinner-overlay--inline]="inline()">
      <div class="spinner"></div>
      @if (message()) {
        <p class="spinner-message">{{ message() }}</p>
      }
    </div>
  `,
  styleUrl: './spinner.scss',
})
export class Spinner {
  message = input('');
  inline = input(false);
}
