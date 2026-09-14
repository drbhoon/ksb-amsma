import { pauseExpiredCommitteeReviews } from '../lib/approval-workflow';
import { prisma } from '../lib/db';

try {
  const paused = await pauseExpiredCommitteeReviews();
  console.log(`[review-deadlines] paused ${paused} application(s)`);
} finally {
  await prisma.$disconnect();
}
