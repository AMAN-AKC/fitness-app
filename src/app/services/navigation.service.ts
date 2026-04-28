import { Injectable } from "@angular/core";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class NavigationService {
  private currentPageSubject = new BehaviorSubject<string>("landing");
  public currentPage$ = this.currentPageSubject.asObservable();

  constructor(private router: Router) {}

  navigateTo(page: string): void {
    this.currentPageSubject.next(page);
    this.router.navigate([page]);
  }

  getCurrentPage(): string {
    return this.currentPageSubject.value;
  }
}
