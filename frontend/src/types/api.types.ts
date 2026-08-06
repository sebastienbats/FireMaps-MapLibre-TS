export interface ApiErrorResponse { error: string; details?: unknown[]; }
export interface ExportRequest { filename: string; data: string | Record<string, unknown>; format: 'geojson' | 'csv'; }
export interface ExportSuccessResponse { success: true; file: string; size: number; }
export interface ExportFileInfo { name: string; size: number; modified: string; }
export interface ExportListResponse { files: ExportFileInfo[]; }
