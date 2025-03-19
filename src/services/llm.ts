import dotenv from 'dotenv';
import { z } from 'zod';
import { LlmImagePageResponse, LlmStoryResponse, StoryParameters } from '../models/index.js';
import { generateVercelImageModel, generateVercelLanguageModel } from './modelGen.js';
import { generateStory } from './storyGen.js'
import { generateImages } from './imageGen.js';

// Load environment variables
dotenv.config();


// Zod schema for prompt template
export const PromptTemplateSchema = z.object({
  system: z.string(),
  user: z.string(),
});

export type PromptTemplate = z.infer<typeof PromptTemplateSchema>;

// Request schema that combines story parameters and additional options
export const StoryRequestSchema = z.object({
  storyParameters: z.custom<StoryParameters>(),
});

export type StoryRequest = z.infer<typeof StoryRequestSchema>;

export class LLMService {

  /**
   * Generate a story based on parameters
   * @param request Story generation request with parameters and options
   * @returns Generated story text
   */
  async generateStory(request: StoryRequest): Promise<{
    llmStory: LlmStoryResponse,
    llmImages: Array<LlmImagePageResponse>
  }> {
    // Validate request with Zod
    const validatedRequest = StoryRequestSchema.parse(request);
    const { storyParameters } = validatedRequest;
    
    // Create prompt for the LLM
    // const prompt = this.createPrompt(storyParameters, options);
    
    try {

      // First create the vercel language model 
      const languageModel = generateVercelLanguageModel()

      // Use this model to generate the text
      const story: LlmStoryResponse = await generateStory(languageModel, storyParameters) 

      // Now create the image model for illustrations
      const imageModel = generateVercelImageModel()

      const images: Array<LlmImagePageResponse> = await generateImages(imageModel, storyParameters, story)


      return {
        llmStory: story,
        llmImages: images
      }

    } catch (error) {
      console.error('Error generating story with LLM:', error);
      throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

}

 