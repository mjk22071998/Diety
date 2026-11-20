import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Diety Platform reference data...');

  // 1. Roles
  const roles = [
    { id: 1, name: 'CUSTOMER' },
    { id: 2, name: 'DIETITIAN' },
    { id: 3, name: 'ADMIN' }
  ];
  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name },
      create: role
    });
  }

  // 2. User Statuses
  const statuses = [
    { id: 1, name: 'ACTIVE' },
    { id: 2, name: 'SUSPENDED' },
    { id: 3, name: 'BANNED' }
  ];
  for (const s of statuses) {
    await prisma.userStatus.upsert({
      where: { id: s.id },
      update: { name: s.name },
      create: s
    });
  }

  // 3. Verification Statuses
  const verificationStatuses = [
    { id: 1, name: 'DRAFT' },
    { id: 2, name: 'PENDING_VERIFICATION' },
    { id: 3, name: 'APPROVED' },
    { id: 4, name: 'REJECTED' },
    { id: 5, name: 'ACTION_REQUIRED' },
    { id: 6, name: 'MODIFIED_PENDING_REVIEW' },
    { id: 7, name: 'SUSPENDED' }
  ];
  for (const vs of verificationStatuses) {
    await prisma.verificationStatus.upsert({
      where: { id: vs.id },
      update: { name: vs.name },
      create: vs
    });
  }

  // 4. Practitioner Types
  const practitionerTypes = [
    {
      id: 1,
      name: 'Licensed Dietitian (RD)',
      badgeSlug: 'rd',
      description: 'Officially licensed registered dietitian with state/government medical board credential.'
    },
    {
      id: 2,
      name: 'Clinical Nutritionist',
      badgeSlug: 'clinical_nutritionist',
      description: 'Accredited university graduate verified via Degree Audit and AI Clinical Simulation Exam.'
    },
    {
      id: 3,
      name: 'Associate Nutritionist',
      badgeSlug: 'associate_nutritionist',
      description: 'Junior nutrition practitioner practicing under clinical supervision.'
    }
  ];
  for (const pt of practitionerTypes) {
    await prisma.practitionerType.upsert({
      where: { id: pt.id },
      update: { name: pt.name, description: pt.description },
      create: pt
    });
  }

  // 5. Dietitian Levels (Fiverr Tier Model)
  const levels = [
    {
      id: 1,
      name: 'New Dietitian',
      slug: 'new',
      minCompletedOrders: 0,
      minRating: 0.0,
      minOnTimeRate: 0.0,
      minEarningsCents: 0,
      commissionRatePercent: 10,
      maxActiveBids: 25,
      description: 'Default entry tier for newly verified practitioners.'
    },
    {
      id: 2,
      name: 'Level 1 Dietitian',
      slug: 'silver',
      minCompletedOrders: 5,
      minRating: 4.5,
      minOnTimeRate: 90.0,
      minEarningsCents: 50000,
      commissionRatePercent: 10,
      maxActiveBids: 35,
      description: 'Practitioner with proven order completion and reliable punctuality.'
    },
    {
      id: 3,
      name: 'Level 2 Dietitian',
      slug: 'gold',
      minCompletedOrders: 20,
      minRating: 4.8,
      minOnTimeRate: 95.0,
      minEarningsCents: 200000,
      commissionRatePercent: 8,
      maxActiveBids: 50,
      description: 'Top-Rated professional with reduced 8% platform commission.'
    },
    {
      id: 4,
      name: 'Top Rated Dietitian',
      slug: 'platinum',
      minCompletedOrders: 50,
      minRating: 4.9,
      minOnTimeRate: 98.0,
      minEarningsCents: 1000000,
      commissionRatePercent: 8,
      maxActiveBids: 75,
      description: 'Elite clinical practitioner with maximum proposal capacity and priority placement.'
    }
  ];
  for (const lvl of levels) {
    await prisma.dietitianLevel.upsert({
      where: { id: lvl.id },
      update: { name: lvl.name, description: lvl.description },
      create: lvl
    });
  }

  // 6. Contract Statuses
  const contractStatuses = [
    { id: 1, name: 'DRAFT' },
    { id: 2, name: 'ACTIVE' },
    { id: 3, name: 'SUBMITTED_FOR_APPROVAL' },
    { id: 4, name: 'CLEARING' },
    { id: 5, name: 'COMPLETED' },
    { id: 6, name: 'DISPUTED' },
    { id: 7, name: 'REFUNDED' },
    { id: 8, name: 'CANCELLED' }
  ];
  for (const cs of contractStatuses) {
    await prisma.contractStatus.upsert({
      where: { id: cs.id },
      update: { name: cs.name },
      create: cs
    });
  }

  // 7. Escrow Transaction Types
  const escrowTypes = [
    { id: 1, name: 'ESCROW_HOLD' },
    { id: 2, name: 'SECURITY_CLEARING' },
    { id: 3, name: 'DISBURSEMENT_PAYOUT' },
    { id: 4, name: 'PLATFORM_FEE_COLLECTION' },
    { id: 5, name: 'CLIENT_REFUND' }
  ];
  for (const et of escrowTypes) {
    await prisma.escrowTransactionType.upsert({
      where: { id: et.id },
      update: { name: et.name },
      create: et
    });
  }

  // 8. Health Goals
  const goals = [
    { id: 1, name: 'Weight Management & Fat Loss', description: 'Sustainable caloric deficit and body recomposition.' },
    { id: 2, name: 'Type 2 Diabetes Glycemic Control', description: 'Carbohydrate titration, glycemic index management.' },
    { id: 3, name: 'Cardiovascular & Lipid Optimization', description: 'Low saturated fat, DASH/Mediterranean dietary patterns.' },
    { id: 4, name: 'Renal / CKD Stage 1-4 Management', description: 'Restricted sodium, potassium, and phosphorus titration.' },
    { id: 5, name: 'Sports Nutrition & Hypertrophy', description: 'High protein macro distribution for athletic performance.' }
  ];
  for (const g of goals) {
    await prisma.healthGoal.upsert({
      where: { id: g.id },
      update: { name: g.name, description: g.description },
      create: g
    });
  }

  // 9. Dietary Preferences
  const preferences = [
    { id: 1, name: 'Omnivore', description: 'Balanced consumption of plant and animal foods.' },
    { id: 2, name: 'Vegetarian', description: 'Plant-based diet including dairy and eggs.' },
    { id: 3, name: 'Vegan', description: 'Strict 100% plant-exclusive diet.' },
    { id: 4, name: 'Ketogenic / Low-Carb', description: 'High-fat, low-carbohydrate nutritional regimen.' },
    { id: 5, name: 'Halal Certified', description: 'Adherence to Islamic dietary guidelines.' }
  ];
  for (const p of preferences) {
    await prisma.dietaryPreference.upsert({
      where: { id: p.id },
      update: { name: p.name, description: p.description },
      create: p
    });
  }

  // 10. Allergens (Clinical Safety Gate)
  const allergens = [
    { id: 1, name: 'Peanuts', severityLevel: 'CRITICAL_ANAPHYLACTIC' },
    { id: 2, name: 'Tree Nuts', severityLevel: 'CRITICAL_ANAPHYLACTIC' },
    { id: 3, name: 'Shellfish', severityLevel: 'CRITICAL_ANAPHYLACTIC' },
    { id: 4, name: 'Dairy / Cow Milk Protein', severityLevel: 'HIGH_ALLERGENIC' },
    { id: 5, name: 'Wheat / Gluten', severityLevel: 'HIGH_CELIAC' },
    { id: 6, name: 'Eggs', severityLevel: 'MEDIUM_ALLERGENIC' },
    { id: 7, name: 'Soy', severityLevel: 'MEDIUM_ALLERGENIC' },
    { id: 8, name: 'Fish', severityLevel: 'HIGH_ALLERGENIC' }
  ];
  for (const a of allergens) {
    await prisma.allergen.upsert({
      where: { id: a.id },
      update: { name: a.name, severityLevel: a.severityLevel },
      create: a
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
