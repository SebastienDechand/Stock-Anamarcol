import { Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { AlertTriangle } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [LucideAngularModule, TranslatePipe],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  title = input<string>();
  message = input<string>();
  confirmLabel = input<string>();
  cancelLabel = input<string>();
  isLoading = input(false);

  confirmed = output<void>();
  cancelled = output<void>();

  readonly icons = { AlertTriangle };
}
