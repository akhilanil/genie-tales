import { z } from "zod";
import { CoreSystemMessage, generateObject, generateText, LanguageModel } from "ai";
import { STORY_GEN_SYSTEM_PROMPT, STORY_GEN_USER_PROMPT } from "./promptConstants.js";
import { LlmStoryResponse, LlmStoryResponseSchema, StoryParameters, StoryTheme } from "../models/index.js";
import logger from "../utils/logger.js";

class StoryGenerator {

    constructor(private languageModel: LanguageModel, private request: StoryParameters) {
        
    }

    private generateMessages() {

    }


    public async generateStory(): Promise<LlmStoryResponse> {
        

        const systemPrompt: CoreSystemMessage = {
            role: 'system',
            content: STORY_GEN_SYSTEM_PROMPT
        }

        const userPrompt: CoreSystemMessage = {
            role: 'system',
            content: STORY_GEN_USER_PROMPT(this.request.ageRange, this.request.theme, this.request.length,  this.request.character)
        }

        logger.info(`Calling LLM to generate story using the messages\n System: ${systemPrompt}  \nUser: ${userPrompt}`)

        const response = await generateObject({
            model: this.languageModel,
            messages: [systemPrompt, userPrompt],
            maxTokens: process.env.LLM_STORY_GEN_MAX_TOKENS ? Number(process.env.LLM_STORY_GEN_MAX_TOKENS) : 8000,
            temperature: process.env.LLM_STORY_GEN_TEMPERATURE ? Number(process.env.LLM_STORY_GEN_TEMPERATURE) : 0.7,
            maxRetries: 5,
            schema: LlmStoryResponseSchema,

        })
        logger.info(`Actual tokens used: Input: ${response.usage?.promptTokens || 'N/A'} Output: ${response.usage?.completionTokens || 'N/A'} Stop Reason: ${response.finishReason}`);
        logger.info(`Cache Creation Input Tokens: ${response.providerMetadata?.anthropic?.cacheCreationInputTokens || 'N/A'}, Cache Read Input Tokens: ${response.providerMetadata?.anthropic?.cacheReadInputTokens || 'N/A'}`);

        logger.info(`AI Response: ${response.object}`)
        logger.info(`Finish Response: ${response.finishReason}`)
        
        return response.object

    }
}


async function generateStory(model: LanguageModel, request: StoryParameters): Promise<LlmStoryResponse> {
    const generator = new StoryGenerator(model, request)

    return generator.generateStory()

}

export { generateStory }

