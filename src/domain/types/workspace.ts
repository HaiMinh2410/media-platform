export type WorkspaceResult = {
  id: string;
  name: string;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateWorkspaceInput = {
  name: string;
  userId: string;
};
