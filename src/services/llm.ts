import dotenv from 'dotenv';
import { z } from 'zod';
import { LlmAudioPageResponse, LlmImagePageResponse, LlmStoryResponse, StoryParameters } from '../models/index.js';
import { generateVercelImageModel, generateVercelLanguageModel } from './modelGen.js';
import { generateStory } from './storyGen.js'
import { generateImages } from './imageGen.js';
import { generateAudioForText } from './audioGen.js';

// Load environment variables
dotenv.config();


/**
 * Zod schema for defining prompt templates
 * Used to structure system and user prompts for LLM interactions
 */
  export const PromptTemplateSchema = z.object({
    system: z.string(), // System message that sets context for the AI
    user: z.string(),   // User message that contains the specific request
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

/**
 * Schema for story generation requests
 * Validates incoming requests to ensure they contain required parameters
 */
export const StoryRequestSchema = z.object({
  storyParameters: z.custom<StoryParameters>(),
});

export type StoryRequest = z.infer<typeof StoryRequestSchema>;

/**
 * Core service class that orchestrates the end-to-end story generation process
 * Coordinates between text generation, image creation, and audio synthesis
 */
export class LLMService {


  /**
   * Main method that generates a complete interactive story experience
   * Produces story text, illustrations, and audio narration
   * 
   * @param request - The validated story request containing generation parameters
   * @returns Object containing the generated story text, images, and audio files
   */
  async generateStory(request: StoryRequest): Promise<{
    llmStory: LlmStoryResponse,
    llmImages: Array<LlmImagePageResponse>,
    llmAudios: Array<LlmAudioPageResponse>
  }> {
    // Validate request with Zod
    const validatedRequest = StoryRequestSchema.parse(request);
    const { storyParameters } = validatedRequest;
    
    try {

      // Step 1: Initialize the language model for text generation
      // Creates an instance of the Vercel AI SDK language model
      const languageModel = generateVercelLanguageModel()

      // Step 2: Generate the story text content
      // This includes the narrative text and illustration prompts for each page
      const story: LlmStoryResponse = await generateStory(languageModel, storyParameters) 

      // Step 3: Initialize the image model for illustration generation
      // Creates an instance of the Vercel AI SDK image model
      const imageModel = generateVercelImageModel()

      // Step 4: Generate illustrations for each page based on the story
      // Uses the illustration prompts from the story generation step
      const images: Array<LlmImagePageResponse> = await generateImages(imageModel, storyParameters, story)

      // Step 5: Generate audio narration for each page of the story
      // Uses ElevenLabs TTS to create natural-sounding narration
      const audios: Array<LlmAudioPageResponse> = await generateAudioForText(story)

      // Return the complete story package with text, images, and audio
      return {
        llmStory: story,
        llmImages: images,
        llmAudios: audios
      }

    } catch (error) {
      console.error('Error generating story with LLM:', error);
      throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}

 