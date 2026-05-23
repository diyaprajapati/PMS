export type WikiPage = {
  id: string;
  projectId: string;
  title: string;
  content: object;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  author?: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
};

export type CreateWikiPageInput = {
  title: string;
  content?: object;
};

export type UpdateWikiPageInput = {
  title?: string;
  content?: object;
};
