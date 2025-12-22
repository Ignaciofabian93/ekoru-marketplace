import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ImpactService } from './impact.service';
import {
  MaterialImpactEstimate,
  EnvironmentalImpact,
} from '../catalog/entities';
import { Co2ImpactMessage, WaterImpactMessage } from './entities';

@Resolver()
export class ImpactResolver {
  constructor(private readonly impactService: ImpactService) {}

  @Query(() => [MaterialImpactEstimate], { name: 'getMaterialImpacts' })
  async getMaterialImpacts() {
    return this.impactService.getMaterialImpacts();
  }

  @Query(() => [Co2ImpactMessage], { name: 'getCo2ImpactMessages' })
  async getCo2ImpactMessages() {
    return this.impactService.getAllCo2ImpactMessages();
  }

  @Query(() => [WaterImpactMessage], { name: 'getWaterImpactMessages' })
  async getWaterImpactMessages() {
    return this.impactService.getAllWaterImpactMessages();
  }

  @Query(() => EnvironmentalImpact, {
    nullable: true,
    name: 'calculateProductImpact',
  })
  async calculateProductImpact(
    @Args('productCategoryId', { type: () => ID }) productCategoryId: string,
  ) {
    return this.impactService.calculateCategoryImpact(
      Number(productCategoryId),
    );
  }
}
