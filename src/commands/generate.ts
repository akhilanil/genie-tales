import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { AgeRange, StoryTheme, StoryLength, StoryParameters, Character } from '../models/index.js';
import { generateVideo, StoryGeneratorService } from '../services/index.js';

// Create the generate command
export const generateCommand = new Command('generate')
  .description('Generate a new story')
  .option('-a, --age <age>', 'Age range of the target audience')
  .option('-t, --theme <theme>', 'Theme of the story')
  .option('-l, --length <length>', 'Length of the story')
  .option('-c, --character <name>', 'Main character name')
  .option('-i, --interactive', 'Use interactive mode to provide inputs', false)
  .option('-o, --output <path>', 'Save the story to a file')
  
  .action(async (options) => {
    try {
      const storyParams = await getStoryParameters(options);
  
      // Show a spinner while generating the story
      const storySpinner = ora('Generating your story and illustrations...').start();
      
      // Use the StoryGeneratorService to generate the story
      const storyGenerator = new StoryGeneratorService();
      const story = await storyGenerator.generateStory(storyParams);

      storySpinner.succeed('Story generated successfully!!!');

      // Show a spinner while generating the video
      const videoSpinner = ora('Combining artifacts to create videos').start();

      // Generating the video
      const videoPath = await generateVideo(story, storyParams.output)

      videoSpinner.succeed(`Videos creaed succesfully at ${videoPath}`)
  
      
      // Display the story in terminal
      console.log(chalk.green(`\n${story.title}`));
      story.contents.forEach(content => {
        console.log(chalk.gray(`-----------------${content.pageNumber}------------------`));
        console.log(content.story);
        console.log(`Illustration: ${content.illustrationPrompts}`);
      })
      
    } catch (error) {
      console.error(chalk.red('Error generating story:'), error);
      process.exit(1);
    }
  });

async function getStoryParameters(options: any): Promise<StoryParameters> {
  // If interactive mode is enabled, prompt for all parameters
  if (options.interactive) {
    return promptForParameters();
  }
  
  // Otherwise, use command line options or prompt for missing ones
  const params: Partial<StoryParameters> = {};
  
  // Age Range
  if (options.age && Object.values(AgeRange).includes(options.age)) {
    params.ageRange = options.age as AgeRange;
  } else {
    const { ageRange } = await inquirer.prompt([{
      type: 'list',
      name: 'ageRange',
      message: 'Select the age range:',
      choices: Object.values(AgeRange)
    }]);
    params.ageRange = ageRange;
  }
  
  // Theme
  if (options.theme && Object.values(StoryTheme).includes(options.theme)) {
    params.theme = options.theme as StoryTheme;
  } else {
    const { theme } = await inquirer.prompt([{
      type: 'list',
      name: 'theme',
      message: 'Select the story theme:',
      choices: Object.values(StoryTheme)
    }]);
    params.theme = theme;
  }
  
  // Length
  if (options.length && Object.values(StoryLength).includes(options.length)) {
    params.length = options.length as StoryLength;
  } else {
    const { length } = await inquirer.prompt([{
      type: 'list',
      name: 'length',
      message: 'Select the story length:',
      choices: Object.values(StoryLength)
    }]);
    params.length = length;
  }
  
  // Character
  const character: Character = { name: '' };
  if (options.character) {
    character.name = options.character;
  } else {
    const { name } = await inquirer.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter the main character name:',
      validate: (input: string) => input.trim() !== '' ? true : 'Name cannot be empty'
    }]);
    character.name = name;
  }
  
  // Character type and traits
  const { type, traits } = await inquirer.prompt([
    {
      type: 'input',
      name: 'type',
      message: 'What type of character is this? (e.g., animal, child, fairy):',
    },
    {
      type: 'input',
      name: 'traits',
      message: 'Enter character traits (comma-separated):',
    }
  ]);
  
  character.type = type || undefined;
  character.traits = traits ? traits.split(',').map((t: string) => t.trim()) : undefined;
  
  return {
    ageRange: params.ageRange as AgeRange,
    theme: params.theme as StoryTheme,
    length: params.length as StoryLength,
    character: character,
    output: process.cwd()
  };
}

async function promptForParameters(): Promise<StoryParameters> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'ageRange',
      message: 'Select the age range:',
      choices: Object.values(AgeRange),
    },
    {
      type: 'list',
      name: 'theme',
      message: 'Select the story theme:',
      choices: Object.values(StoryTheme)
    },
    {
      type: 'list',
      name: 'length',
      message: 'Select the story length:',
      choices: Object.values(StoryLength)
    },
    {
      type: 'input',
      name: 'characterName',
      message: 'Enter the main character name:',
      validate: (input: string) => input.trim() !== '' ? true : 'Name cannot be empty'
    },
    {
      type: 'input',
      name: 'characterType',
      message: 'What type of character is this? (e.g., animal, child, fairy):'
    },
    {
      type: 'input',
      name: 'characterTraits',
      message: 'Enter character traits (comma-separated):'
    },
    {
      type: 'input',
      name: 'output',
      message: 'Path for storing the video:',
      default: process.cwd()
    }
  ]);
  
  const character: Character = {
    name: answers.characterName,
    type: answers.characterType || undefined,
    traits: answers.characterTraits ? 
      answers.characterTraits.split(',').map((t: string) => t.trim()) : 
      undefined
  };
  
  return {
    ageRange: answers.ageRange,
    theme: answers.theme,
    length: answers.length,
    character: character,
    output: answers.output
  };
}