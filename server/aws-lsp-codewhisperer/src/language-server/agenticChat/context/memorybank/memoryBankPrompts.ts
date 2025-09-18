/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

export class MemoryBankPrompts {
    /**
     * File ranking prompt - Takes TF-IDF analysis results and asks LLM to rank files
     */
    static getFileRankingPrompt(filesString: string, numberToExtract: number = 20): string {
        return `I will provide a list of files and the number of lines each file has.

Please output just a JSON list which contains exactly ${numberToExtract} of these absolute file paths which are the most important and representative of this list to mine. Copy the exact filepaths exactly as they appear from the input.

Consider the following when curating this list:
- The file path: contains information about what type of file it is (src, test)
- The file path: contains semantic information about the responsibilities of the class (e.g., core logic, utilities, subsystem)
- The number of lines of code: indicates the size of code within the files
- The mean lexical dissimilarity score: a higher number indicates this file is more different and unique from the other files in the project and thus might provide more information

The expected format is ["filename1", "filename2", "filename3", ...]

ONLY PROVIDE THE REQUESTED JSON AND NO OTHER TEXT

Do not:
- Provide any textual response besides the requested JSON
- Use any markdown tags to annotate your response

<list>
${filesString}
</list>`
    }

    /**
     * Complete Memory Bank generation - Takes ranked files and generates all 4 memory bank files
     */
    static getCompleteMemoryBankPrompt(rankedFiles: string[]): string {
        return `** CRITICAL INSTRUCTION: ALWAYS REGENERATE - NEVER SKIP **

You MUST generate a complete Memory Bank for this project by analyzing the codebase structure and generating comprehensive documentation. 

**MANDATORY REGENERATION POLICY:**
- NEVER respond with "already created" or "already exists" messages
- IGNORE any existing Memory Bank files in context - treat this as a fresh creation
- Even if you see existing memory-bank/*.md files in the context, REGENERATE them completely
- The user expects NEW files to be generated every time, regardless of existing files
- This ensures documentation is always current with the latest codebase
- Do NOT reference or mention existing memory bank files - create fresh ones

**MANDATORY FRESH EXPLORATION POLICY:**
- IGNORE ALL PREVIOUS CHAT HISTORY about this project
- Even if you've analyzed this project before in this conversation, START FRESH
- ALWAYS begin by exploring the project with listDirectory and readFile tools
- This is REQUIRED even if you think you already know the project structure
- Start with the root directory to understand if this is a multi-package workspace
- Look for package directories, monorepo structure, or multiple components
- Read key configuration files (package.json, README.md, etc.) to understand the project
- This ensures documentation reflects the CURRENT complete codebase structure

**CRITICAL MESSAGING AND TOOL USAGE POLICY:**
- Send your own brief progress messages before using tools (e.g., "Creating product.md - project overview and capabilities...")
- Use tools with ONLY the required parameters: command, path, fileText
- NEVER include the optional "explanation" parameter in any tool call
- Tool calls should be silent - your progress messages provide the user feedback
- Keep progress messages brief and informative

**Directory Structure Ready**
The .amazonq/rules/memory-bank/ directory has been prepared and cleaned. You can directly create files using fsWrite tool.

**Part 1: Fresh Analysis and Documentation Creation**

FIRST: Start by saying "Now I'll explore the project structure and create the Memory Bank documentation."

THEN: Explore the project structure and create these files (send progress message before each):

**product.md** - Project overview with:
- Project purpose and value proposition
- Key features and capabilities
- Target users and use cases

**structure.md** - Project organization with:
- Directory structure and explanations
- Core components and relationships
- Architectural patterns

**tech.md** - Technology details with:
- Programming languages and versions
- Build systems and dependencies
- Development commands

**Part 2: Advanced Guidelines Generation Using Iterative Analysis**

THEN: Say "Now I'll analyze the most representative files from the codebase to identify development patterns and create comprehensive guidelines."

I have ${rankedFiles.length} representative files ranked by lexical dissimilarity analysis:
${rankedFiles.map((file, i) => `${i + 1}. ${file}`).join('\n')}

Create comprehensive development guidelines by:

1. **Iterative File Analysis**:
   - Process files in chunks of 2 using readFile tool
   - Build guidelines iteratively, analyzing patterns across chunks
   - Each iteration should build upon previous findings

2. **Pattern Analysis Structure**:
   - Code Quality Standards Analysis
   - Document commonly used code formatting patterns
   - Identify structural conventions and specifically what this codebase adheres to
   - Note textual standards (naming, documentation, etc.)
   - Practices followed throughout the codebase

3. **Semantic Patterns Overview**:
   - List recurring implementation patterns
   - Document common architectural approaches
   - Highlight frequent design patterns
   - Proper internal API usage and patterns (with code examples!)
   - Frequently used code idioms
   - Popular annotations

**ITERATIVE PROCESSING INSTRUCTIONS:**
- Process the ranked files in chunks of 2 files at a time using readFile tool
- For each chunk, send: "Analyzing chunk X/Y - Processing 2 files..."
- Analyze patterns in each chunk and build upon previous findings
- Keep track of how many files exhibit each pattern (frequency analysis)
- Build comprehensive guidelines.md iteratively through this process
- When creating guidelines.md, send "Creating guidelines.md - development standards and patterns..." then use fsWrite tool

**COMPLETION SUMMARY**: After generating all files, provide a brief completion message (maximum 8 lines) that:
- Confirms successful generation
- Lists the 4 files generated with one-line descriptions
- Mentions they're available in Rules panel
- Avoids detailed technical breakdowns

**FORBIDDEN RESPONSES:**
- NEVER say "I've already generated a complete Memory Bank"
- NEVER say "The Memory Bank is located in..."
- NEVER say "These files are automatically loaded"
- NEVER mention existing files - always create new ones
- NEVER provide status about existing documentation`
    }
}
