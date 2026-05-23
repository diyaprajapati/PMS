export type WikiPage = {
  id: string;
  projectId: string;
  title: string;
  content: string;
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
  content?: string;
};

export type UpdateWikiPageInput = {
  title?: string;
  content?: string;
};
