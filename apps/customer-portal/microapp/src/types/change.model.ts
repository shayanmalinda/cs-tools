export interface ChangeRequest {
  id: string;
  number: string;
  title: string;
  description: string;
  requestType?: string;
  impactId?: string;
  statusId?: string;
  endDate?: Date;
  createdOn: Date;
  updatedOn: Date;
  createdBy: string;
  approvedBy?: string;
  approvedOn?: Date;
  duration?: string;
  hasCustomerApproved: boolean;
  hasCustomerReviewed: boolean;
  assignedTeam?: string;
  serviceOutage?: string;
  rollbackPlan?: string;
  communicationPlan?: string;
  testPlan?: string;
  deployment?: string;
}

export type ChangeRequestSummary = Pick<
  ChangeRequest,
  | "id"
  | "number"
  | "title"
  | "description"
  | "requestType"
  | "impactId"
  | "statusId"
  | "assignedTeam"
  | "endDate"
  | "createdOn"
  | "updatedOn"
>;
