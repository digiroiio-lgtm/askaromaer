export type FormState = { ok?: boolean; message?: string; error?: string; fields?: Record<string, string>; redirectTo?: string };
export const initialState: FormState = {};
