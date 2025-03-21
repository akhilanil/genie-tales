import { StoryParameters, Story, LlmStoryResponse, StoryContent } from '../models/index.js';
import { LLMService, StoryRequest } from './llm.js';
import {v4 as uuidv4} from 'uuid';
import path from 'path';
import os from 'os'
import fs from 'fs/promises';
import { saveBase64ImageToFile, writeStreamToFile } from '../utils/index.js';
import logger from '../utils/logger.js';


export class StoryGeneratorService {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  /**
   * Method to initilise atifact directories
   * @returns Promise with created image and audio artifact directory
   */
  async generateArtifactDirs(): Promise<{imageDir: string, audioDir:string}> {
    // Create an artifact path to store images and audio files
    let randomuuid = uuidv4();
    
    // Set up the image directory in the temp folder
    const imageDir = path.join(os.tmpdir(), 'genie-tales', randomuuid, 'images');

    // Set up the audio directory in the temp folder
    const audioDir = path.join(os.tmpdir(), 'genie-tales', randomuuid, 'audios');

    // Create the directories
    await fs.mkdir(imageDir, { recursive: true });
    await fs.mkdir(audioDir, { recursive: true });

    return {imageDir, audioDir}
  }
 
  /**
   * Generate a story based on parameters
   * @param params Story parameters including age range, theme, length, and characters
   * @returns Promise with generated story with metadata
   */
  async generateStory(
    params: StoryParameters, 

  ): Promise<Story> {
    // Prepare request for LLM service
    const request: StoryRequest = {
      storyParameters: params
    };

    // Generate story content and illustrations
    const { llmStory, llmImages, llmAudios } = await this.llmService.generateStory(request);

    const { imageDir, audioDir } = await this.generateArtifactDirs()
    
    

    const imageMap: Map<Number, string> = new Map()
    for (const image of llmImages) {
      const imageFilePath = path.join(imageDir, `${image.pageNumber}.png`)
      logger.info(`Saving image to file: ${imageFilePath}`)
      await saveBase64ImageToFile(image.base64, imageFilePath)
      imageMap.set(image.pageNumber, imageFilePath)
    }

    const audioMap: Map<Number, string> = new Map()
    for (const audio of llmAudios) {
      const audioFilePath = path.join(audioDir, `${audio.pageNumber}.mp3`)
      logger.info(`Saving audio to file: ${audioFilePath}`)
      await writeStreamToFile(audio.audioStream, audioFilePath)
      audioMap.set(audio.pageNumber, audioFilePath)
    }
    

    const storyContents: Array<StoryContent> = llmStory.pages.map(page => {
      return {
        pageNumber: page.pageNumber,
        story: page.story,
        illustrationPrompts: page.illustationPrompt,
        imagePath: imageMap.get(page.pageNumber),
        audioPath: audioMap.get(page.pageNumber)
      }
    })

    // Create story object
    const story: Story = {
      contents: storyContents,
      title: llmStory.storyTitle,
      parameters: request.storyParameters,
      createdAt: new Date()
    };

    return story;
  }

}