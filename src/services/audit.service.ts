import { AuditLog } from "../models";

export class AuditService {
  async log(
    userId: string,
    action: string,
    entity: string,
    entityId?: string,
    oldValues?: object,
    newValues?: object,
    ipAddress?: string,
  ): Promise<void> {
    try {
      await AuditLog.create({
        userId,
        action,
        entity,
        entityId,
        oldValues,
        newValues,
        ipAddress,
      });
    } catch (error) {
      // Audit log failures should not disrupt main flow
      console.error("Audit log failed:", error);
    }
  }
}

export const auditService = new AuditService();
