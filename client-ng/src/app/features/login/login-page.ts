import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AsyncPipe } from '@angular/common';
import { LucideAngularModule } from 'lucide-angular';
import { Eye, EyeOff, Package } from 'lucide-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthFacade } from '../../store/auth/facade/auth.facade';
import { LanguageToggle } from '../../shared/components/language-toggle/language-toggle';

@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [FormsModule, AsyncPipe, LucideAngularModule, TranslatePipe, LanguageToggle],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  protected authFacade = inject(AuthFacade);

  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Package = Package;

  readonly year = new Date().getFullYear();

  email = signal('');
  password = signal('');
  showPassword = signal(false);

  onSubmit() {
    if (!this.email() || !this.password()) return;
    this.authFacade.login(this.email(), this.password());
  }

  togglePassword() {
    this.showPassword.update((v) => !v);
  }
}
