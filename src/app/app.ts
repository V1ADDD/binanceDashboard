import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { Theme } from './shared/services/theme';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, MatToolbarModule, MatIcon, MatIconButton],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App implements OnInit {
  protected readonly title = signal('binance-dashboard');
  private themeService = inject(Theme);

  public get isDarkTheme(): boolean {
    return this.themeService.isDarkTheme();
  }

  public toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  public ngOnInit(): void {
    this.themeService.initializeTheme();
  }
}
