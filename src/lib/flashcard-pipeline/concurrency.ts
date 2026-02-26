/**
 * Concurrency Limiter — limits parallel async tasks.
 *
 * Usage:
 *   const limiter = new ConcurrencyLimiter(4);
 *   await limiter.run(() => fetch(...));
 */

export class ConcurrencyLimiter {
  private running = 0;
  private queue: Array<() => void> = [];

  constructor(private maxConcurrency: number) {}

  async run<T>(fn: () => Promise<T>): Promise<T> {
    // Wait for a slot
    if (this.running >= this.maxConcurrency) {
      await new Promise<void>((resolve) => {
        this.queue.push(resolve);
      });
    }

    this.running++;
    try {
      return await fn();
    } finally {
      this.running--;
      // Release next waiting task
      const next = this.queue.shift();
      if (next) next();
    }
  }

  /** Cancel all waiting tasks */
  clear() {
    this.queue = [];
  }

  get pendingCount(): number {
    return this.queue.length;
  }

  get activeCount(): number {
    return this.running;
  }
}
