import { z } from "zod";
import { CoreSystemMessage, generateObject, ImageModel } from "ai";
import { experimental_generateImage as generateImage } from 'ai';

import {  IMAGE_GEN_SYSTEM_PROMPT } from "./promptConstants.js";
import { LlmImagePageResponse, LlmStoryResponse, LlmStoryResponseSchema, Story, StoryParameters, StoryTheme } from "../models/index.js";
import logger from "../utils/logger.js";

class ImageGenerator {

    constructor(private imageModel: ImageModel, private request: StoryParameters, private story: LlmStoryResponse) {}


    public async generateImage(): Promise<Array<LlmImagePageResponse>> {

        let imageResponse: Array<LlmImagePageResponse> = []

        for (const content of this.story.pages) {
            
            const prompt = IMAGE_GEN_SYSTEM_PROMPT(this.request.ageRange, this.request.theme, this.request.character, content.illustationPrompt)
            
            logger.info(`Calling LLM to generate image for the page ${content.pageNumber} using the prompt: ${prompt}`)

            const response = await generateImage({
                model: this.imageModel,
                prompt: prompt,
                n: 1,
                size: "1024x1024",
                aspectRatio: "4:3",
                maxRetries: 5,
            })
            imageResponse.push({
                pageNumber: content.pageNumber,
                illustationPrompt: content.illustationPrompt,
                base64: response.image.base64,
                uint8Array: response.image.uint8Array
            })

            logger.info(`Image created successfully for page: ${content.pageNumber}`)
            
            
        }
        logger.info("All images created successfully.")

        return imageResponse;

    }
}


async function generateImages(model: ImageModel, request: StoryParameters, story: LlmStoryResponse): Promise<Array<LlmImagePageResponse>> {
    const generator = new ImageGenerator(model, request, story)

    return generator.generateImage()

}

export { generateImages }

