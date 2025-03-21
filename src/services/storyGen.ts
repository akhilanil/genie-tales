import { z } from "zod";
import { CoreSystemMessage, CoreUserMessage, generateObject, generateText, LanguageModel } from "ai";
import { STORY_GEN_SYSTEM_PROMPT, STORY_GEN_USER_PROMPT } from "./promptConstants.js";
import { LlmStoryResponse, LlmStoryResponseSchema, StoryParameters, StoryTheme } from "../models/index.js";
import logger from "../utils/logger.js";
import { log } from "console";

/**
 * Class responsible for generating story content using AI language models
 * Handles prompt construction and AI response parsing
 */
class StoryGenerator {

    /**
     * Creates a new StoryGenerator instance
     * @param languageModel - The AI language model to use for generation
     * @param request - Parameters defining the story characteristics
     */
    constructor(private languageModel: LanguageModel, private request: StoryParameters) {}

    /**
     * Generates a complete story based on the provided parameters
     * Uses structured JSON output to ensure proper formatting
     * @returns Promise with the generated story response
     */
    public async generateStory(): Promise<LlmStoryResponse> {

        // Create system message using the predefined template
        // This establishes the AI's role and output requirements
        const systemPrompt: CoreSystemMessage = {
            role: 'system',
            content: STORY_GEN_SYSTEM_PROMPT
        }

        // Create user message with specific story parameters
        const userPrompt: CoreUserMessage = {
            role: 'user',
            content: STORY_GEN_USER_PROMPT(this.request.ageRange, this.request.theme, this.request.length,  this.request.character)
        }

        logger.info(`Calling LLM to generate story`)
        logger.debug(`System Prompt: ${systemPrompt.content}`)
        logger.debug(`User Prompt: ${userPrompt.content}`)

        // Call the AI model with structured output schema
        // This enforces the response format defined in LlmStoryResponseSchema
        const response = await generateObject({
            model: this.languageModel,
            messages: [systemPrompt, userPrompt],
            maxTokens: process.env.LLM_STORY_GEN_MAX_TOKENS ? Number(process.env.LLM_STORY_GEN_MAX_TOKENS) : 8000,
            temperature: process.env.LLM_STORY_GEN_TEMPERATURE ? Number(process.env.LLM_STORY_GEN_TEMPERATURE) : 0.7,
            maxRetries: 5,
            schema: LlmStoryResponseSchema,

        })
        // Log detailed information about token usage for monitoring
        logger.info(`Actual tokens used: Input: ${response.usage?.promptTokens || 'N/A'} Output: ${response.usage?.completionTokens || 'N/A'} Stop Reason: ${response.finishReason}`);
        logger.info(`Cache Creation Input Tokens: ${response.providerMetadata?.anthropic?.cacheCreationInputTokens || 'N/A'}, Cache Read Input Tokens: ${response.providerMetadata?.anthropic?.cacheReadInputTokens || 'N/A'}`);

        logger.info(`AI Response: ${response.object}`)
        logger.info(`Finish Response: ${response.finishReason}`)
        
        return response.object

    }
}

/**
 * Utility function to generate a story
 * Simplifies the interface for external consumers
 * 
 * @param model - The AI language model to use
 * @param request - Story parameters including theme, character, and age range
 * @returns Promise with the complete generated story
 */
async function generateStory(model: LanguageModel, request: StoryParameters): Promise<LlmStoryResponse> {
    const generator = new StoryGenerator(model, request)

    return generator.generateStory()

}

export { generateStory }

