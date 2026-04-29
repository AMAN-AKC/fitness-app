import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css'],
  standalone: false,
})
export class EmptyStateComponent {
  @Input() icon: string = 'calendar'; // calendar, search, inbox, etc.
  @Input() title: string = 'No items found';
  @Input() description: string =
    'Try adjusting your filters or search criteria.';
  @Input() buttonText: string = 'Clear All Filters';
  @Input() buttonAction: (() => void) | null = null;
  @Input() iconBgColor: string = '#F0F4FF';
  @Input() iconColor: string = '#2563EB';
  @Input() isGhost: boolean = true;

  constructor(private sanitizer: DomSanitizer) {}

  onButtonClick(): void {
    if (this.buttonAction) {
      this.buttonAction();
    }
  }

  getIconSvg(): SafeHtml {
    const icons: any = {
      calendar:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
      search:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      inbox:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 21 6 12 2 12"/><path d="M9 21H15M6 12H18V10C18 8.9 17.1 8 16 8H8C6.9 8 6 8.9 6 10V12Z"/></svg>',
      box: '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
      heart:
        '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    };
    const svg = icons[this.icon] || icons['box'];
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
