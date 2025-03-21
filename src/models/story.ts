import Stream from "stream";
import { z } from "zod";

export enum AgeRange {
    TODDLER = 'toddler', // 1-3 years
    PRESCHOOL = 'preschool', // 3-5 years
    EARLY_READER = 'early-reader', // 5-7 years
    MIDDLE_GRADE = 'middle-grade', // 8-12 years
  }
  
  export enum StoryTheme {
    ADVENTURE = 'adventure',
    FANTASY = 'fantasy',
    ANIMALS = 'animals',
    FRIENDSHIP = 'friendship',
    FAMILY = 'family',
    SCHOOL = 'school',
    NATURE = 'nature',
    SCIENCE = 'science',
  }
  
  export enum StoryLength {
    SHORT = 'short', // few paragraphs
    MEDIUM = 'medium', // few pages
    LONG = 'long', // chapter-like
  }
  
  export interface Character {
    name: string;
    type?: string; // e.g., "animal", "child", "fairy"
    traits?: string[]; // e.g., "brave", "curious"
  }
  
  export interface StoryParameters {
    ageRange: AgeRange;
    theme: StoryTheme;
    length: StoryLength;
    character: Character;
    output: string;
  }
  
  export interface Story {
    title: string;
    contents: Array<StoryContent>;
    parameters: StoryParameters;
    createdAt: Date;
  }

  export interface StoryContent {
    pageNumber: number,
    story: string,
    illustrationPrompts: string
    imagePath?: string 
    audioPath?: string 
  }


  export interface LlmImagePageResponse {
    readonly pageNumber: number
    
    readonly illustationPrompt: string

    readonly base64: string;
  
    readonly uint8Array: Uint8Array;

  }

  export interface LlmAudioPageResponse {
    readonly pageNumber: number
    
    readonly storyContent: string

    readonly audioStream: Stream.Readable;
  
  }

  

  export const LlmStoryPageResponseSchema = z.object({
    pageNumber: z.number(),
    story: z.string(),
    illustationPrompt: z.string(),
  });
  
  export const LlmStoryResponseSchema = z.object({
    storyTitle: z.string(),
    pages: z.array(LlmStoryPageResponseSchema),
  });
  
  export type LlmStoryResponse = z.infer<typeof LlmStoryResponseSchema>;