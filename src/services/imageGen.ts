import { z } from "zod";
import { CoreSystemMessage, generateObject, ImageModel } from "ai";
import { experimental_generateImage as generateImage } from 'ai';

import {  IMAGE_GEN_SYSTEM_PROMPT } from "./promptConstants.js";
import { LlmImagePageResponse, LlmStoryResponse, LlmStoryResponseSchema, Story, StoryParameters, StoryTheme } from "../models/index.js";
import logger from "../utils/logger.js";

/**
 * Service class responsible for generating images for story pages
 * Uses AI image generation models to create illustrations based on story content
 */
class ImageGenerator {

    /**
     * Creates a new ImageGenerator instance
     * @param imageModel - The AI image model to use for generation
     * @param request - Parameters defining the story characteristics
     * @param story - The story content for which images will be generated
     */
    constructor(private imageModel: ImageModel, private request: StoryParameters, private story: LlmStoryResponse) {}

    /**
     * Generates images for each page of the story
     * @returns Promise containing an array of image responses for each page
     */
    public async generateImage(): Promise<Array<LlmImagePageResponse>> {

        let imageResponse: Array<LlmImagePageResponse> = []

        for (const content of this.story.pages) {
            
            // Construct the image generation prompt using story parameters and page-specific illustration prompt
            const prompt = IMAGE_GEN_SYSTEM_PROMPT(this.request.ageRange, this.request.theme, this.request.character, content.illustationPrompt)
            
            logger.info(`Calling LLM to generate image for the page ${content.pageNumber} using the prompt: ${prompt}`)

             // Call the AI service to generate the image
            const response = await generateImage({
                model: this.imageModel,
                prompt: prompt,
                n: 1,                   // Generate one image per page
                size: "1024x1024",      // High resolution square image
                aspectRatio: "4:3",     // Standard children's book ratio
                maxRetries: 5,          // Retry failed generations to ensure success
            })

            // Store the generated image along with its metadata
            imageResponse.push({
                pageNumber: content.pageNumber,
                illustationPrompt: content.illustationPrompt,
                base64: response.image.base64,          // Base64 encoded image for web display
                uint8Array: response.image.uint8Array   // Binary image data for file operations
            })

            logger.info(`Image created successfully for page: ${content.pageNumber}`)
            
            
        }
        logger.info("All images created successfully.")

        return imageResponse;

    }
}

/**
 * Utility function to generate images for a complete story
 * @param model - The AI image model to use
 * @param request - Story parameters including theme, character, and age range
 * @param story - The story content with illustration prompts
 * @returns Promise containing an array of image responses for each page
 */
async function generateImages(model: ImageModel, request: StoryParameters, story: LlmStoryResponse): Promise<Array<LlmImagePageResponse>> {
    const generator = new ImageGenerator(model, request, story)

    return generator.generateImage()

}

export { generateImages }

