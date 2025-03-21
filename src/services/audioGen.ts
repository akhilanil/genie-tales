import { ElevenLabsClient } from 'elevenlabs';
import { LlmAudioPageResponse, LlmStoryResponse } from '../models/index.js';

/**
 * Service class to handle text-to-speech conversion using ElevenLabs API
 * Converts story text content into audio files
 */
class ElevenLabsTTS {

    private elevenlabsClient: ElevenLabsClient;

     /**
     * Creates a new ElevenLabsTTS instance
     * @param story - The story content to be converted to audio
     */
    constructor(private story: LlmStoryResponse) {
        this.elevenlabsClient = new ElevenLabsClient({
            apiKey: process.env.ELEVENLABS_API_KEY,
        });
    }

    /**
     * Generates audio for each page of the story
     * @returns Promise containing an array of audio responses for each page
     */
    async generateAudioForStory(): Promise<Array<LlmAudioPageResponse>> {

        const audioResponses: Array<LlmAudioPageResponse> = [] 

        for(const content of this.story.pages) {
            const audioStream = await this.elevenlabsClient.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
                text: content.story,
                model_id: "eleven_multilingual_v2",
                output_format: "mp3_44100_128",
            });
            audioResponses.push(
                {
                    pageNumber: content.pageNumber,
                    storyContent: content.story,
                    audioStream: audioStream
                }
            )
        }

        return audioResponses
        
    }
}

/**
 * Utility function to generate audio for a complete story
 * @param story - The story content to be converted to audio
 * @returns Promise containing an array of audio responses for each page
 */
async function generateAudioForText(story: LlmStoryResponse): Promise<Array<LlmAudioPageResponse>> {
    const audioGen = new ElevenLabsTTS(story)
    return audioGen.generateAudioForStory()
}

export {generateAudioForText}
