import { RevenueGuardian } from './revenue-guardian.js';
import { GrowthStrategist } from './growth-strategist.js';
import { SkepticalOperator } from './skeptical-operator.js';
import { ContentAnalyst } from './content-analyst.js';
import { CompetitiveIntel } from './competitive-intel.js';
import { CustomerAdvocate } from './customer-advocate.js';
import { TechArchitect } from './tech-architect.js';
import { FinancialAnalyst } from './financial-analyst.js';

export { RevenueGuardian, GrowthStrategist, SkepticalOperator, ContentAnalyst, CompetitiveIntel, CustomerAdvocate, TechArchitect, FinancialAnalyst };

export function getAllPersonas() {
  return [
    new RevenueGuardian(),
    new GrowthStrategist(),
    new SkepticalOperator(),
    new ContentAnalyst(),
    new CompetitiveIntel(),
    new CustomerAdvocate(),
    new TechArchitect(),
    new FinancialAnalyst(),
  ];
}
