import { Component } from '@angular/core';

@Component({
  selector: 'app-placeholder-page',
  templateUrl: './placeholder-page.component.html',
  styleUrls: ['./placeholder-page.component.css'],
})
export class PlaceholderPageComponent {
  title = 'Page Under Construction';
  description =
    'This page is currently being developed and will be available soon.';

  constructor() {}
}
