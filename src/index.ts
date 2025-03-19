#!/usr/bin/env node

import { Command } from 'commander';
import { generateCommand } from './commands/index.js';

// Create the main program
const program = new Command();

program
  .name('genie-tales')
  .description('CLI tool to generate children\'s stories using LLM')
  .version('0.1.0');

// Add the generate command
program.addCommand(generateCommand);

// Parse the command line arguments
program.parse();