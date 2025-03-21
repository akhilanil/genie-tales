import Stream from "stream";
import fs from 'fs';
import logger from "./logger.js";


/**
 * Writes a readable stream to a file
 * Useful for saving stream-based content like audio or binary data
 * 
 * @param stream - The readable stream to be saved
 * @param fileName - The path where the file should be written
 * @returns Promise that resolves when the write operation completes
 */
export async function writeStreamToFile(stream: Stream.Readable, fileName: string): Promise<void> {
    
    // Create a writable file stream at the specified path
    const writeStream = fs.createWriteStream(fileName);

    // Pipe the input stream to the file write stream
    // This efficiently handles data flow without loading everything into memory
    stream.pipe(writeStream);

    // Return a promise that resolves when the stream is fully written
    // or rejects if an error occurs during writing
    new Promise<void>((resolve, reject) => {
      writeStream.on("finish", () => {
        logger.debug(`Stream saved at ${fileName}`);
        resolve();
      });
       // Set up event handler for error conditions
      writeStream.on("error", (error) => {
        logger.error("Error writing Stream:", error);
        reject(error);
      });
    });
}


/**
 * Saves an image from base64 data to a file
 * Handles both raw base64 strings and data URIs (e.g., "data:image/png;base64,...")
 * 
 * @param base64Data - The base64-encoded image data (can include data URI prefix)
 * @param filePath - The file where the image should be saved
 * @returns Promise that resolves when the file is written
 */
export async function saveBase64ImageToFile(base64Data: string, filePath: string) {
    
    // Remove the data URI prefix if it exists (e.g., "data:image/png;base64,")
    // This handles both formats: raw base64 and data URIs
    const base64Image = base64Data.split(';base64,').pop() || base64Data;
    
    // Convert base64 string to binary buffer
    // This transforms the text representation into actual binary data
    const imageBuffer = Buffer.from(base64Image, 'base64');

    // Write the buffer directly to file using the promise-based fs API
    // More efficient than using streams for one-time buffer writes
    await fs.promises.writeFile(filePath, imageBuffer);

    // Log successful file creation
    logger.debug(`Image created at: ${filePath}`)
}

