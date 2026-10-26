export type Segment = { id: string; start: number; end: number; text: string };
export type Lecture = {
  id: string; title: string; source: string; createdAt: string; duration: number;
  transcript: Segment[]; summary: string; outline: { title: string; time: number; description: string }[];
  keywords: string[];
};
