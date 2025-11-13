import { DOCUMENT, inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  private readonly THEME_KEY = 'app-theme';
  private readonly DARK_THEME_CLASS = 'dark-theme';
  private document = inject(DOCUMENT);

  public initializeTheme(): void {
    const savedTheme = localStorage.getItem(this.THEME_KEY) || 'light';
    this.setTheme(savedTheme);
  }

  public getCurrentTheme(): string {
    return localStorage.getItem(this.THEME_KEY) || 'light';
  }

  public setTheme(theme: string): void {
    const htmlElement = this.document.documentElement;

    if (theme === 'dark') {
      htmlElement.classList.add(this.DARK_THEME_CLASS);
    } else {
      htmlElement.classList.remove(this.DARK_THEME_CLASS);
    }

    localStorage.setItem(this.THEME_KEY, theme);
  }

  public toggleTheme(): void {
    const currentTheme = this.getCurrentTheme();
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  public isDarkTheme(): boolean {
    return this.getCurrentTheme() === 'dark';
  }
}
