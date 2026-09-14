import { prisma } from './db';
import type { Prisma } from '@prisma/client';

export async function recordAudit(params: {
  applicationId?: string;
  actorUserId?: string;
  event: string;
  details?: Prisma.InputJsonValue;
}) {
  return prisma.auditEvent.create({
    data: {
      applicationId: params.applicationId,
      actorUserId: params.actorUserId,
      event: params.event,
      details: params.details,
    },
  });
}
