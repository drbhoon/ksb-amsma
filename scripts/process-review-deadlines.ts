import { pauseExpiredCommitteeReviews } from '../lib/approval-workflow';
import { prisma } from '../lib/db';

async function main() {
  try {
    const paused = await pauseExpiredCommitteeReviews();
    console.log(`[review-deadlines] paused ${paused} application(s)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('[review-deadlines] failed', error);
  process.exitCode = 1;
});
