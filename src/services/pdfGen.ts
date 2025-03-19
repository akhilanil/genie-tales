import { Story } from "../models/index.js";
import puppeteer from 'puppeteer';
import MarkdownIt from 'markdown-it';
import fs from 'fs/promises';
import path from 'path';
import os from 'os'
import {v4 as uuidv4} from 'uuid';
import logger from "../utils/logger.js";


/**
 * Saves an image from base64 data to a file
 * @param base64Data The base64-encoded image data (can include data URI prefix)
 * @param outputPath The path where the file should be saved
 */
async function saveBase64ImageToFile(base64Data: string, fileName: string): Promise<string> {

    let randomuuid = uuidv4();
    
     // Set up the image directory in the temp folder
    const imageDir = path.join(os.tmpdir(), 'genie-images', randomuuid);
    
    // Create the full output path
    const outputPath = path.join(imageDir, fileName);
    
    // Remove the data URI prefix if it exists (e.g., "data:image/png;base64,")
    const base64Image = base64Data.split(';base64,').pop() || base64Data;
    
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, 'base64');
    
    // Ensure the directory exists
    const directory = path.dirname(outputPath);
    await fs.mkdir(directory, { recursive: true });
    
    // Write the buffer to file
    await fs.writeFile(outputPath, imageBuffer);

    logger.info(`Image created at: ${outputPath}`)

    return outputPath
}

export async function createStoryPdf(story: Story) {
    const md = new MarkdownIt();

    // Generate HTML content for each page
    let htmlPages = `
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; font-size: 14px; }
                h1, h2 { text-align: center; }
                .page { page-break-before: always; }
                img { max-width: 100%; display: block; margin: 20px auto; }
                pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
            </style>
        </head>
        <body>
    `;

    // Add the title page
    htmlPages += `<h1>${story.title}</h1><h3>Created on ${story.createdAt.toDateString()}</h3>`;

    // Add content pages
    for (const content of story.contents) {
        htmlPages += `<div class="page">${md.render(content.story)}`;
        if (content.imageBase64) {
            const imagePath = await saveBase64ImageToFile(content.imageBase64, `${content.pageNumber}.png`)
            htmlPages += `<img src="${imagePath}" alt="Story Image"/>`;
        }
        htmlPages += `</div>`;
    }

    htmlPages += `</body></html>`;

    // Launch Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(htmlPages, { waitUntil: 'load' });

    // Generate PDF with multiple pages
    await page.pdf({
        path: 'story.pdf',
        format: 'A4',
        printBackground: true,
    });

    await browser.close();
    console.log(`Story PDF created: story.pdf`);
}

