import { exec } from "child_process";
import { promisify } from "util";
import * as fsextra from "fs-extra";
import * as fspromise from 'fs/promises';
import * as fs from 'fs';
import { Story } from "../models/story.js";
import logger from "../utils/logger.js";
import path from "path";
import os from 'os'
import {v4 as uuidv4} from 'uuid';

/**
 * Service class responsible for generating videos from story content
 * Combines image and audio files into a cohesive video presentation
 * Uses FFmpeg command-line utility for media processing
 */
class VideoGenerator {

    /**
     * Default name for the final combined video file
     */
    static VIDEO_NAME = 'story.mp4'

    private execPromise;                        // Promisified exec function for async command execution
    private fileListContents: Array<string>     // Holds list of video files for concatenation
    private fileListPath: string                // Path to the file containing video list for FFmpeg
    private tmpFolder: string                    // Temporary working directory for intermediate files
    
    /**
     * Creates a new VideoGenerator instance
     * @param story - The story content with images and audio paths
     * @param outputFolder - Directory where the final video will be saved
     */
    constructor(private story: Story, private outputFolder: string) {
         
        // Create promisified version of exec for async command execution
        this.execPromise = promisify(exec);
        // Initialize empty file list for video concatenation
        this.fileListContents = []
        // Create unique temporary folder to prevent conflicts
        let randomuuid = uuidv4();
        this.tmpFolder = path.join(os.tmpdir(), 'genie-videos', randomuuid);
        // Define path for FFmpeg concat list file
        this.fileListPath = path.join(this.tmpFolder, 'file_list.txt');
        
    }

    /**
     * Generates a complete video from story content
     * Combines each page's image and audio into individual clips, then merges them
     * @returns Promise with the path to the final video file
     */
    async generateVideo(): Promise<string> {
        // Ensure output folder exists
        await fsextra.ensureDir(this.outputFolder);
         // Create temporary working directory
        await fspromise.mkdir(this.tmpFolder, {recursive: true});

        // Process each page of the story
        for (const content of this.story.contents) {
            const image = content.imagePath
            const audio = content.audioPath
            
            // Define output filename for this page's video segment
            const fileName = `page-${content.pageNumber}.mp4`
            const outputVideo =  path.join(this.tmpFolder, fileName);
            
            // Add this segment to the concatenation list
            this.fileListContents.push(`file ${outputVideo}`)
            
            logger.info(`Generating video for ${image} with ${audio}...`);

            // FFmpeg command to create video from static image and audio
            // -loop 1: Loops the image (makes it static)
            // -c:v libx264: Use H.264 video codec
            // -tune stillimage: Optimize for static images
            // -shortest: End when shortest input stream ends (audio)
            // -pix_fmt yuv420p: Use standard pixel format for compatibility
            // -y: Overwrite output file if it exists
            const ffmpegCommand = `ffmpeg -loop 1 -i ${image} -i ${audio} -c:v libx264 -tune stillimage -shortest -pix_fmt yuv420p -y ${outputVideo}`;
            
            // Execute the FFmpeg command
            await this.execPromise(ffmpegCommand);
            logger.info(`Video Create successfully at ${outputVideo}`)

        }

        // Write the list of video files to the concat list file
        await fspromise.writeFile(this.fileListPath, this.fileListContents.join("\n"));

        // Define path for final combined video
        const finalVideo = path.join(this.outputFolder, VideoGenerator.VIDEO_NAME)
        

        // FFmpeg command to concatenate all page videos
        // First removes any existing file to prevent errors
        // -f concat: Use concat demuxer for file list input
        // -safe 0: Don't require safe filenames
        // -c copy: Copy streams without re-encoding to preserve quality
        const mergeCommand = `rm -f ${finalVideo} && ffmpeg -f concat -safe 0 -i ${this.fileListPath} -c copy ${finalVideo}`;
        
        // Execute the concatenation command
        await this.execPromise(mergeCommand);
      
        logger.info(`video created: ${finalVideo}. Cleaning ${this.tmpFolder}`);

        return finalVideo
        
    }

}

/**
 * Utility function to generate a video from a story
 * Simplifies the interface for external consumers
 * 
 * @param story - The story content with images and audio paths
 * @param outputFolder - Directory where the final video will be saved
 * @returns Promise with the path to the generated video file
 */
async function generateVideo(story: Story, outputFolder: string): Promise<string> {

    const videoGen = new VideoGenerator(story, outputFolder)
    return videoGen.generateVideo()

}

export {generateVideo}




