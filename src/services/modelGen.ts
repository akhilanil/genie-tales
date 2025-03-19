import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { ImageModel, LanguageModel } from 'ai';
import 'reflect-metadata';

// Zod schema for LLM configuration
const ProviderConfigSchema = z.object({
  model: z.string(),
  apiKey: z.string()
});

type ProviderConfig = z.infer<typeof ProviderConfigSchema>;


abstract class  LanguageModelGenerator {

    constructor( protected providerType: string, protected modelName: string  ) {}

    abstract canCreateModel(): boolean

    abstract genrateLanguageModel(): LanguageModel
}

abstract class  ImageModelGenerator {

    constructor( protected providerType: string, protected modelName: string  ) {}

    abstract canCreateModel(): boolean

    abstract genrateImageModel(): ImageModel
}

class OpenAIImageGenerator extends ImageModelGenerator {
    
    canCreateModel(): boolean {
        return this.providerType == 'OPENAI'
    }

    genrateImageModel(): ImageModel {
        const config = {
            model: this.modelName,
            apiKey: process.env.OPENAI_KEY
        };
      
        // Validate config using Zod
        const providerConfig: ProviderConfig = ProviderConfigSchema.parse(config);

        return createOpenAI({
            apiKey: providerConfig.apiKey,
        }).image(
            providerConfig.model
        )
    }
}

class OpenAILanguageGenerator extends LanguageModelGenerator {
    
    canCreateModel(): boolean {
        return this.providerType == 'OPENAI'
    }

    genrateLanguageModel(): LanguageModel {
        const config = {
            model: this.modelName,
            apiKey: process.env.OPENAI_KEY
        };
      
        // Validate config using Zod
        const providerConfig: ProviderConfig = ProviderConfigSchema.parse(config);

        return createOpenAI({
            apiKey: providerConfig.apiKey,
        }).languageModel(
            providerConfig.model,
            {
                structuredOutputs: true
            }
        )
    }
}

class AnthropicLanguageModelGenerator extends LanguageModelGenerator {

    canCreateModel(): boolean {
        return this.providerType == 'ANTHROPIC'
    }

    genrateLanguageModel(): LanguageModel {
        const config = {
            model: this.modelName,
            apiKey: process.env.ANTHROPIC_KEY,
        };
      
        // Validate config using Zod
        const providerConfig: ProviderConfig = ProviderConfigSchema.parse(config);

        return createAnthropic({
            apiKey: providerConfig.apiKey,
        }).languageModel(
            providerConfig.model
        )
    }
}

class GeneratorContext {

    private languageModelgenerators: Array<LanguageModelGenerator>
    private imageModelgenerators: Array<ImageModelGenerator>

    constructor(private providerType: string, private modelName: string) {
        
        this.languageModelgenerators = [
            new OpenAILanguageGenerator(this.providerType, this.modelName,),
            new AnthropicLanguageModelGenerator(this.providerType, this.modelName,),
        ]

        this.imageModelgenerators = [
            new OpenAIImageGenerator(this.providerType, this.modelName,),
        ]
    }

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


class VercelLanguageModelGenerator {

    private generatorContext: GeneratorContext

    constructor() {
        const provider = process.env.STORY_LLM_PROVIDER;
        const modelName = process.env.STORY_LLM_MODEL_NAME;

        if (provider !== 'OPENAI' && provider !== 'ANTHROPIC') {
            throw new Error(`Invalid STORY_LLM_PROVIDER: ${provider}. Only OPENAI and ANTHROPIC supported`);
        } 

        if(!modelName) {
            throw new Error("No model defined for the story unde the env STORY_LLM_MODEL_NAME");
        }

        this.generatorContext = new GeneratorContext(provider, modelName)
    }

    public generateLanguageModel(): LanguageModel {
        return this.generatorContext.getLanguageModel()
    }

}

class VercelImageModelGenerator {

    private generatorContext: GeneratorContext

    constructor() {
        const provider = process.env.ILLUSTRATION_LLM_PROVIDER;
        const modelName = process.env.ILLUSTRATION_LLM_MODEL_NAME;

        if (provider !== 'OPENAI') {
            throw new Error(`Invalid ILLUSTRATION_LLM_PROVIDER: ${provider}. Only OPENAI supported`);
        } 

        if(!modelName) {
            throw new Error("No model defined for the story unde the env STORY_LLM_MODEL_NAME");
        }

        this.generatorContext = new GeneratorContext(provider, modelName)
    }

    public generateImageModel(): ImageModel {
        return this.generatorContext.getImageModel()
    }

}

function generateVercelLanguageModel(): LanguageModel {
    const generator = new VercelLanguageModelGenerator()
    return generator.generateLanguageModel()
}

function generateVercelImageModel(): ImageModel {
    const generator = new VercelImageModelGenerator()
    return generator.generateImageModel()
}

export {generateVercelLanguageModel, generateVercelImageModel}

