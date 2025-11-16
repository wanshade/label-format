export interface LabelLine {
  text: string;
  textSizeMm: number;
  spacingTopMm: string | number;
  spacingLeftMm: string | number;
}

export interface Project {
  id: string; // UUID
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Relationship to user (next-auth)
  name: string;
  description?: string;
}

export interface LabelSetup {
  id: string; // UUID
  createdAt: Date;
  updatedAt: Date;
  projectId: string; // Relationship to project
  name?: string; // Optional name for the label setup

  labelLengthMm: number;
  labelHeightMm: number;
  labelThicknessMm: number;
  labelColourBackground: string;
  textColour: string;
  labelQuantity: number;
  style: string;
  noOfHoles: number;
  holeSizeMm: number;
  holeDistanceMm: number;

  lines: LabelLine[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
}

export interface CreateLabelSetupRequest {
  projectId: string;
  name?: string;
  labelLengthMm: number;
  labelHeightMm: number;
  labelThicknessMm: number;
  labelColourBackground: string;
  textColour: string;
  labelQuantity: number;
  style: string;
  noOfHoles: number;
  holeSizeMm: number;
  holeDistanceMm: number;
  lines: LabelLine[];
}

export interface UpdateLabelSetupRequest extends Partial<CreateLabelSetupRequest> {}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {}