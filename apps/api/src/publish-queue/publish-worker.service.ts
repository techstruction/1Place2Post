import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PublishQueueService } from './publish-queue.service';

@Injectable()
export class PublishWorkerService implements OnModuleInit, OnModuleDestroy {
    private readonly log = new Logger(PublishWorkerService.name);
    private timer: ReturnType<typeof setInterval> | null = null;
    private backfillTimer: ReturnType<typeof setInterval> | null = null;

    constructor(private queue: PublishQueueService) { }

    onModuleInit() {
        this.log.log('Publish worker started — polling every 15s');
        // Run once on boot
        this.queue.backfill(200).then(n => n > 0 && this.log.log(`Backfilled ${n} jobs`));
        this.queue.processJobs(5).catch(e => this.log.error('Initial process failed', e));

        // Main polling loop  
        this.timer = setInterval(async () => {
            try { await this.queue.processJobs(5); }
            catch (e) { this.log.error('Worker poll error', e); }
        }, 15_000);

        // Backfill + stale lock cleanup every 2 min
        this.backfillTimer = setInterval(async () => {
            try {
                const n = await this.queue.backfill(200);
                if (n > 0) this.log.log(`Backfilled ${n} jobs`);
                const { count } = await this.queue.resetStaleLocks();
                if (count > 0) this.log.warn(`Reset ${count} stale locks`);
            } catch (e) { this.log.error('Backfill error', e); }
        }, 2 * 60 * 1000);
    }

    onModuleDestroy() {
        if (this.timer) clearInterval(this.timer);
        if (this.backfillTimer) clearInterval(this.backfillTimer);
    }
}
