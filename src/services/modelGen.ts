import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { ImageModel, LanguageModel } from 'ai';
import 'reflect-metadata';

/**
 * Zod schema for validating AI provider configurations
 * Ensures both model name and API key are provided
 */
const ProviderConfigSchema = z.object({
  model: z.string(),
  apiKey: z.string()
});

type ProviderConfig = z.infer<typeof ProviderConfigSchema>;

/**
 * Abstract base class for language model generation
 * Defines the contract that all language model generators must implement
 */
abstract class  LanguageModelGenerator {

    /**
     * @param providerType - The AI provider identifier (e.g., "OPENAI", "ANTHROPIC")
     * @param modelName - The specific model name to use
     */
    constructor( protected providerType: string, protected modelName: string  ) {}

    /**
     * Determines if this generator can create the requested model type
     * Used for dynamic provider selection in the strategy pattern
     */
    abstract canCreateModel(): boolean

    /**
     * Creates and returns a configured language model instance
     * Implemented by concrete provider-specific subclasses
     */
    abstract genrateLanguageModel(): LanguageModel
}

/**
 * Abstract base class for image model generation
 * Defines the contract that all image model generators must implement
 */
abstract class  ImageModelGenerator {

    /**
     * @param providerType - The AI provider identifier (e.g., "OPENAI")
     * @param modelName - The specific model name to use
     */
    constructor( protected providerType: string, protected modelName: string  ) {}

     /**
     * Determines if this generator can create the requested model type
     * Used for dynamic provider selection in the strategy pattern
     */
    abstract canCreateModel(): boolean

     /**
     * Creates and returns a configured image model instance
     * Implemented by concrete provider-specific subclasses
     */
    abstract genrateImageModel(): ImageModel
}

/**
 * Concrete implementation of ImageModelGenerator for OpenAI
 * Handles creation of DALL-E and other OpenAI image generation models
 */
class OpenAIImageGenerator extends ImageModelGenerator {
    
    /**
     * Checks if this generator handles OpenAI image models
     */
    canCreateModel(): boolean {
        return this.providerType == 'OPENAI'
    }

    /**
     * Creates an OpenAI image model using the Vercel AI SDK
     * @returns Configured OpenAI image model instance
     */
    genrateImageModel(): ImageModel {
        const config = {
            model: this.modelName,
            apiKey: process.env.OPENAI_KEY
        };
      
        // Validate config using Zod to ensure all required fields exist
        const providerConfig: ProviderConfig = ProviderConfigSchema.parse(config);

        // Create and return the OpenAI image model
        return createOpenAI({
            apiKey: providerConfig.apiKey,
        }).image(
            providerConfig.model
        )
    }
}


/**
 * Concrete implementation of LanguageModelGenerator for OpenAI
 * Handles creation of GPT models with appropriate configuration
 */
class OpenAILanguageGenerator extends LanguageModelGenerator {
    
    /**
     * Checks if this generator handles OpenAI language models
     */
    canCreateModel(): boolean {
        return this.providerType == 'OPENAI'
    }

    /**
     * Creates an OpenAI language model using the Vercel AI SDK
     * @returns Configured OpenAI language model instance with structured output capability
     */
    genrateLanguageModel(): LanguageModel {
        const config = {
            model: this.modelName,
            apiKey: process.env.OPENAI_KEY
        };
      
        // Validate config using Zod
        const providerConfig: ProviderConfig = ProviderConfigSchema.parse(config);

        // Create and return the OpenAI language model with structured outputs enabled
        return createOpenAI({
            apiKey: providerConfig.apiKey,
        }).languageModel(
            providerConfig.model,
            {
                structuredOutputs: true // Enable JSON structure parsing for schema-based outputs
            }
        )
    }
}

/**
 * Concrete implementation of LanguageModelGenerator for Anthropic
 * Handles creation of Claude models with appropriate configuration
 */
class AnthropicLanguageModelGenerator extends LanguageModelGenerator {

    /**
     * Checks if this generator handles Anthropic language models
     */
    canCreateModel(): boolean {
        return this.providerType == 'ANTHROPIC'
    }

    /**
     * Creates an Anthropic language model using the Vercel AI SDK
     * @returns Configured Anthropic language model instance
     */
    genrateLanguageModel(): LanguageModel {
        const config = {
            model: this.modelName,
            apiKey: process.env.ANTHROPIC_KEY,
        };
      
        // Validate config using Zod
        const providerConfig: ProviderConfig = ProviderConfigSchema.parse(config);

        // Create and return the Anthropic language model
        return createAnthropic({
            apiKey: providerConfig.apiKey,
        }).languageModel(
            providerConfig.model
        )
    }
}

/**
 * Context class implementing the Strategy pattern for model generation
 * Maintains a collection of generators and selects the appropriate one at runtime
 */
class GeneratorContext {

    private languageModelgenerators: Array<LanguageModelGenerator>
    private imageModelgenerators: Array<ImageModelGenerator>

    /**
     * Initializes the context with all available model generators
     * @param providerType - The AI provider to use
     * @param modelName - The specific model name to instantiate
     */
    constructor(private providerType: string, private modelName: string) {
        
        // Register all available language model generators
        this.languageModelgenerators = [
            new OpenAILanguageGenerator(this.providerType, this.modelName,),
            new AnthropicLanguageModelGenerator(this.providerType, this.modelName,),
        ]

        // Register all available image model generators
        this.imageModelgenerators = [
            new OpenAIImageGenerator(this.providerType, this.modelName,),
        ]
    }

    /**
     * Finds and uses the appropriate language model generator
     * @returns A configured language model instance
     * @throws Error if no suitable generator is found
     */
    public getLanguageModel(): LanguageModel {
        const generator: LanguageModelGenerator | undefined = this.languageModelgenerators.find((generator) => {
            if(generator.canCreateModel()) {
                return generator.genrateLanguageModel()
            }
        })
        if (generator) {
            return generator.genrateLanguageModel()
        } else {
            throw new Error(`Cannot find language generator for the provider ${this.providerType} and model ${this.modelName}`)
        }   
    }

     /**
     * Finds and uses the appropriate image model generator
     * @returns A configured image model instance
     * @throws Error if no suitable generator is found
     */
    public getImageModel(): ImageModel {
        const generator: ImageModelGenerator | undefined = this.imageModelgenerators.find((generator) => {
            if(generator.canCreateModel()) {
                return generator.genrateImageModel()
            }
        })
        if (generator) {
            return generator.genrateImageModel()
        } else {
            throw new Error(`Cannot find image generator for the provider ${this.providerType} and model ${this.modelName}`)
        }   
    }

}


/**
 * Facade class for generating language models based on environment configuration
 * Handles environment variable validation and initialization
 */
class VercelLanguageModelGenerator {

    private generatorContext: GeneratorContext

    constructor() {
        const provider = process.env.STORY_LLM_PROVIDER;
        const modelName = process.env.STORY_LLM_MODEL_NAME;

        // Validate provider is supported
        if (provider !== 'OPENAI' && provider !== 'ANTHROPIC') {
            throw new Error(`Invalid STORY_LLM_PROVIDER: ${provider}. Only OPENAI and ANTHROPIC supported`);
        } 

        // Validate model name is provided
        if(!modelName) {
            throw new Error("No model defined for the story unde the env STORY_LLM_MODEL_NAME");
        }

        this.generatorContext = new GeneratorContext(provider, modelName)
    }

    /**
     * Creates a language model based on environment configuration
     * @returns Configured language model instance
     */
    public generateLanguageModel(): LanguageModel {
        return this.generatorContext.getLanguageModel()
    }

}

/**
 * Facade class for generating image models based on environment configuration
 * Handles environment variable validation and initialization
 */
class VercelImageModelGenerator {

    private generatorContext: GeneratorContext

    /**
     * Sets up the generator context based on environment variables
     * @throws Error if provider or model name is invalid or missing
     */
    constructor() {
        const provider = process.env.ILLUSTRATION_LLM_PROVIDER;
        const modelName = process.env.ILLUSTRATION_LLM_MODEL_NAME;

         // Currently only OpenAI is supported for image generation
        if (provider !== 'OPENAI') {
            throw new Error(`Invalid ILLUSTRATION_LLM_PROVIDER: ${provider}. Only OPENAI supported`);
        } 

        // Validate model name is provided
        if(!modelName) {
            throw new Error("No model defined for the story unde the env STORY_LLM_MODEL_NAME");
        }

        this.generatorContext = new GeneratorContext(provider, modelName)
    }

    /**
     * Creates an image model based on environment configuration
     * @returns Configured image model instance
     */
    public generateImageModel(): ImageModel {
        return this.generatorContext.getImageModel()
    }

}

/**
 * Utility function to create a language model
 * Simplifies the interface for external consumers
 * @returns Configured language model instance
 */
function generateVercelLanguageModel(): LanguageModel {
    const generator = new VercelLanguageModelGenerator()
    return generator.generateLanguageModel()
}

/**
 * Utility function to create an image model
 * Simplifies the interface for external consumers
 * @returns Configured image model instance
 */
function generateVercelImageModel(): ImageModel {
    const generator = new VercelImageModelGenerator()
    return generator.generateImageModel()
}

export {generateVercelLanguageModel, generateVercelImageModel}

