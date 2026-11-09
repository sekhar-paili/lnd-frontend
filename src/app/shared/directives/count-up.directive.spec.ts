import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CountUpDirective } from './count-up.directive';

@Component({
  template: `<span [appCountUp]="value" [countUpDuration]="duration">0</span>`,
  standalone: false,
})
class HostComponent {
  value: number | null | undefined = 0;
  duration = 40;
}

describe('CountUpDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  const text = (): string => fixture.nativeElement.querySelector('span').textContent;
  const settle = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 150));

  function mockReducedMotion(reduced: boolean): void {
    spyOn(window, 'matchMedia').and.returnValue({ matches: reduced } as MediaQueryList);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ declarations: [HostComponent, CountUpDirective] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('counts up to the bound value', async () => {
    mockReducedMotion(false);
    fixture.componentInstance.value = 7;
    fixture.detectChanges();

    await settle();

    expect(text()).toBe('7');
  });

  it('counts down when the value decreases', async () => {
    mockReducedMotion(false);
    fixture.componentInstance.value = 9;
    fixture.detectChanges();
    await settle();

    fixture.componentInstance.value = 2;
    fixture.detectChanges();
    await settle();

    expect(text()).toBe('2');
  });

  it('shows the final value immediately when reduced motion is requested', () => {
    mockReducedMotion(true);
    fixture.componentInstance.value = 12;
    fixture.componentInstance.duration = 5000; // would take seconds if animated
    fixture.detectChanges();

    expect(text()).toBe('12');
  });

  it('treats null, undefined and negative values as 0', () => {
    mockReducedMotion(true);
    for (const bad of [null, undefined, -3]) {
      fixture.componentInstance.value = bad;
      fixture.detectChanges();
      expect(text()).toBe('0');
    }
  });

  it('rounds fractional values to a whole number', () => {
    mockReducedMotion(true);
    fixture.componentInstance.value = 4.6;
    fixture.detectChanges();

    expect(text()).toBe('5');
  });
});
