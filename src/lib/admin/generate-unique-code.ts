import "server-only";

const nonSpacingMarksPattern = /[\u0300-\u036f]/g;
const invalidCodeCharactersPattern = /[^a-z0-9-]+/g;
const repeatedDashPattern = /-+/g;

type CodeLookupClient = {
  from(table: string): {
    select(columns: string): {
      eq(column: string, value: string): {
        limit(count: number): PromiseLike<{
          data: unknown[] | null;
          error: { message: string } | null;
        }>;
      };
    };
  };
};

export function generateCodeBase(value: string, fallback = "contenu") {
  const code = value
    .normalize("NFD")
    .replace(nonSpacingMarksPattern, "")
    .toLowerCase()
    .replace(/&/g, " et ")
    .replace(/['’]/g, "")
    .replace(invalidCodeCharactersPattern, "-")
    .replace(repeatedDashPattern, "-")
    .replace(/^-|-$/g, "");

  return code || fallback;
}

export async function generateUniqueCode(
  supabaseClient: unknown,
  table: string,
  source: string,
  fallback?: string,
) {
  const supabase = supabaseClient as CodeLookupClient;
  const base = generateCodeBase(source, fallback);
  let candidate = base;
  let suffix = 2;

  while (suffix < 1000) {
    const { data, error } = await supabase
      .from(table)
      .select("id")
      .eq("code", candidate)
      .limit(1);

    if (error) {
      throw new Error(error.message);
    }

    if (!data || data.length === 0) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  throw new Error("Unable to generate a unique code");
}
