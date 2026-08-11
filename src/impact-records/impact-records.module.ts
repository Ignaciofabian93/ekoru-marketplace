import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ImpactService } from '../services/impact.service';
import { ImpactRepository } from '../repositories/impact.repository';
import { ImpactRecordsService } from './impact-records.service';
import { ImpactRecordsResolver } from './impact-records.resolver';

/**
 * Immutable per-seller records of the environmental saving from completed P2P
 * deals, plus the year-in-review reporting built on them.
 *
 * Separate from ProductsModule because these rows deliberately outlive the
 * products they came from — that is what lets sold products and their images
 * be deleted without losing the history.
 */
@Module({
  imports: [PrismaModule],
  providers: [
    ImpactRecordsService,
    ImpactRecordsResolver,
    ImpactService,
    ImpactRepository,
  ],
  exports: [ImpactRecordsService],
})
export class ImpactRecordsModule {}
