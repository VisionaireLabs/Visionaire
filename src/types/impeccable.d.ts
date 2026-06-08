// Ambient module declaration for `impeccable` (pbakaus/impeccable).
// The package ships ESM only, no .d.ts. We use `detectHtml` from
// /api/audit/route.ts and don't need full type coverage here.

declare module "impeccable" {
  export interface ImpeccableFinding {
    antipattern: string;
    name: string;
    description: string;
    file?: string;
    line?: number;
    snippet?: string;
  }

  export function detectHtml(filePath: string): Promise<ImpeccableFinding[]>;
  export function detectText(
    content: string,
    filePath: string,
  ): ImpeccableFinding[];
  export function detectUrl(url: string): Promise<ImpeccableFinding[]>;
}
