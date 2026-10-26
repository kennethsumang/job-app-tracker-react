export { applicationsPaths, applicationsRoutes } from "./routes";
export {
  applicationsService,
  ApplicationsService,
} from "./services/applications.service";
export type {
  ApplicationFilters,
  ApplicationsResponse,
  CreateApplicationPayload,
  EmploymentType,
  JobApplication,
  JobApplicationStatus,
  UpdateApplicationPayload,
  UpdateApplicationStatusPayload,
  WorkplaceType,
} from "./services/applications.service";
export {
  applicationsKeys,
  useApplications,
  useApplicationsCount,
  useCreateApplication,
  useDeleteApplication,
  usePermanentDeleteApplication,
  useRestoreApplication,
  useUpdateApplication,
  useUpdateApplicationStatus,
} from "./hooks/use-applications";
export type { UpdateApplicationStatusVariables } from "./hooks/use-applications";
export { useApplication } from "./hooks/use-application-detail";