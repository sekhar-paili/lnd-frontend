import { Directive, ElementRef, Input, OnChanges, OnDestroy } from '@angular/core';

/** True when the user has asked the OS/browser to minimise motion. */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animates a number from its previous value up (or down) to the bound value.
 *
 *   <div [appCountUp]="snapshot.completed">0</div>
 *
 * The element's text is managed by the directive. With reduced motion enabled
 * the final value is shown immediately.
 */
@Directive({
  selector: '[appCountUp]',
  standalone: false,
})
export class CountUpDirective implements OnChanges, OnDestroy {
  @Input('appCountUp') target: number | null | undefined = 0;
  /** Animation length in milliseconds. */
  @Input() countUpDuration = 900;

  private frame = 0;
  private shown = 0;

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngOnChanges(): void {
    this.run();
  }

  ngOnDestroy(): void {
    cancelAnimationFrame(this.frame);
  }

  private run(): void {
    cancelAnimationFrame(this.frame);
    const to = Math.max(0, Math.round(Number(this.target) || 0));
    const from = this.shown;

    if (to === from || prefersReducedMotion() || this.countUpDuration <= 0) {
      this.render(to);
      return;
    }

    const start = performance.now();
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / this.countUpDuration);
      // Ease-out cubic: fast at first, settling gently on the final value.
      const eased = 1 - Math.pow(1 - t, 3);
      this.render(Math.round(from + (to - from) * eased));
      if (t < 1) {
        this.frame = requestAnimationFrame(tick);
      }
    };
    this.frame = requestAnimationFrame(tick);
  }

  private render(value: number): void {
    this.shown = value;
    this.el.nativeElement.textContent = String(value);
  }
}
