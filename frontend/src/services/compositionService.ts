import {
  Composition,
  MusicScore,
  RhythmScore,
} from "@/types/music";

interface GenerateOptions {
  prompt: string;
  model?: string;
  duration_seconds?: number;
  bpm?: number;
}

async function callApi<T>(
  endpoint: string,
  options: GenerateOptions
): Promise<T> {
  const response = await fetch(
    `/api/v1/mcp/${endpoint}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(options),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `API Error ${response.status}: ${error}`
    );
  }

  return response.json();
}

export const compositionService = {
  async generateMelody(
    options: GenerateOptions
  ): Promise<MusicScore> {
    return callApi<MusicScore>(
      "generate_melody",
      options
    );
  },

  async generateRhythm(
    options: GenerateOptions
  ): Promise<RhythmScore> {
    return callApi<RhythmScore>(
      "generate_rhythm",
      options
    );
  },

  async generateComposition(
    options: GenerateOptions
  ): Promise<Composition> {
    return callApi<Composition>(
      "generate_composition",
      options
    );
  },
};
