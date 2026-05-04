import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NotificationsCenterComponent } from './notifications-center.component';

describe('NotificationsCenterComponent', () => {
  let component: NotificationsCenterComponent;
  let fixture: ComponentFixture<NotificationsCenterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NotificationsCenterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with 6 notifications', () => {
    expect(component.notifications.length).toBe(6);
  });

  it('should count unread notifications', () => {
    expect(component.unreadCount).toBe(2);
  });

  it('should filter unread notifications', () => {
    component.filterType = 'unread';
    expect(component.filteredNotifications.length).toBe(2);
  });

  it('should mark notification as read', () => {
    const notification = component.notifications[0];
    component.markAsRead(notification);
    expect(notification.read).toBe(true);
  });

  it('should delete notification', () => {
    const initialCount = component.notifications.length;
    component.deleteNotification(component.notifications[0].id);
    expect(component.notifications.length).toBe(initialCount - 1);
  });

  it('should get notification icon', () => {
    expect(component.getNotificationIcon('success')).toBe('✓');
    expect(component.getNotificationIcon('error')).toBe('✕');
  });
});
