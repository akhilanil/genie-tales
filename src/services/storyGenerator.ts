import { StoryParameters, Story, LlmStoryResponse, StoryContent } from '../models/index.js';
import { LLMService, StoryRequest } from './llm.js';

export class StoryGeneratorService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Generate a story based on parameters
   * @param params Story parameters including age range, theme, length, and characters
   * @param options Additional options for story generation
   * @returns Generated story with metadata
   */
  async generateStory(
    params: StoryParameters, 

  ): Promise<Story> {
    // Prepare request for LLM service
    const request: StoryRequest = {
      storyParameters: params
    };

    // Generate story content and illustrations
    const { llmStory, llmImages } = await this.llmService.generateStory(request);

    const imageMap: Map<Number, string> = new Map()

    llmImages.forEach(image => {
      imageMap.set(image.pageNumber, image.base64)
    });

    const storyContent: Array<StoryContent> = llmStory.pages.map(page => {
      return {
        pageNumber: page.pageNumber,
        story: page.story,
        illustrationPrompts: page.illustationPrompt,
        imageBase64: imageMap.get(page.pageNumber)
      }
    })

    // Create story object
    const story: Story = {
      contents: storyContent,
      title: llmStory.storyTitle,
      parameters: request.storyParameters,
      createdAt: new Date()
    };

    return story;
  }

}