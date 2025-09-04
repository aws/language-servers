/**
 * Copied from chat/contexts/triggerContext.ts for the purpose of developing a divergent implementation.
 * Will be deleted or merged.
 */

export class MemoryBankPrompts {
    /**
     * PROMPT 1: File ranking prompt - Takes TF-IDF analysis results and asks LLM to rank files
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
     * PROMPT 2: Complete Memory Bank creation - Takes ranked files and creates all 4 memory bank files
     */
    static getCompleteMemoryBankPrompt(rankedFiles: string[]): string {
        return `**🚨 CRITICAL INSTRUCTION: ALWAYS REGENERATE - NEVER SKIP 🚨**

You MUST create a complete Memory Bank for this project by analyzing the codebase structure and generating comprehensive documentation. 

**MANDATORY REGENERATION POLICY:**
- NEVER respond with "already created" or "already exists" messages
- ALWAYS delete and recreate ALL 4 files with fresh analysis
- IGNORE any existing Memory Bank files in context - treat this as a fresh creation
- Even if you see existing memory-bank/*.md files in the context, REGENERATE them completely
- The user expects NEW files to be generated every time, regardless of existing files
- This ensures documentation is always current with the latest codebase
- Do NOT reference or mention existing memory bank files - create fresh ones

**🔍 MANDATORY FRESH EXPLORATION POLICY:**
- IGNORE ALL PREVIOUS CHAT HISTORY about this project
- Even if you've analyzed this project before in this conversation, START FRESH
- ALWAYS begin by exploring the project with listDirectory and readFile tools
- Show your exploration process to the user (e.g., "I'll analyze the codebase...")n
- This is REQUIRED even if you think you already know the project structure

**📝 CONSISTENT MESSAGING POLICY:**
- ALWAYS provide explanatory text before each tool call
- For every fsWrite tool use, first write: "Creating [description] for [project name]"
- Never use tools without explanatory text first
- This ensures users see what you're doing before the tool execution begins

**MANDATORY FRESH EXPLORATION REQUIRED:**
- IGNORE any previous knowledge about this project from chat history
- ALWAYS start by exploring the project structure with listDirectory and readFile tools
- Even if you've seen this project before, treat it as completely new
- Show your exploration process: "I'll analyze the codebase and create a complete Memory Bank..."
- List directories and read key files to understand the current state
- This ensures documentation reflects the CURRENT codebase, not historical knowledge

**Directory Structure Ready**
The .amazonq/rules/memory-bank/ directory has been prepared and cleaned. You can directly create files using fsWrite tool.

**Part 1: Fresh Analysis and Documentation Creation**

FIRST: Start by saying "I'll analyze the codebase and create a complete Memory Bank with fresh documentation. Let me start by exploring the project structure and then create all 4 files."

THEN: Use listDirectory and readFile tools to explore the project structure and create:

**CRITICAL: For each file creation, ALWAYS follow this exact pattern:**
1. First write explanatory text: "Creating [file description] for [project name]"
2. Then immediately use the fsWrite tool
3. Never use fsWrite without explanatory text first

**product.md** - Project overview with:
- Project purpose and value proposition
- Key features and capabilities
- Target users and use cases
- ALWAYS say "Creating product overview for [project name]" before using fsWrite

**structure.md** - Project organization with:
- Directory structure and explanations
- Core components and relationships
- Architectural patterns
- ALWAYS say "Creating structure documentation for [project name]" before using fsWrite

**tech.md** - Technology details with:
- Programming languages and versions
- Build systems and dependencies
- Development commands
- ALWAYS say "Creating technology documentation for [project name]" before using fsWrite

**Part 2: Advanced Guidelines Generation Using Below Iterative Analysis Approach**

I have ${rankedFiles.length} representative files ranked by lexical dissimilarity analysis:
${rankedFiles.map((file, i) => `${i + 1}. ${file}`).join('\n')}

I will create comprehensive development guidelines by:

1. **Iterative File Analysis** (following science methodology):
   - Process files in chunks of 4 using readFile tool
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
- Process the ranked files in chunks of 4 files at a time
- For each chunk, FIRST provide a status update like: "📝 **Analyzing chunk X/Y** - Processing files: file1.py, file2.py, file3.py, file4.py"
- THEN use readFile tool to read the file contents for that chunk
- Analyze patterns in each chunk and build upon previous findings
- Keep track of how many files exhibit each pattern (frequency analysis)
- Build comprehensive guidelines.md iteratively
- When creating guidelines.md, ALWAYS say "Creating development guidelines for [project name]" before using fsWrite

**COMPLETION SUMMARY**: After creating all files, provide a brief completion message (maximum 8 lines) that:
- Confirms successful creation with celebratory emoji
- Lists the 4 files created with one-line descriptions
- Mentions they're available in Rules panel
- Avoids detailed technical breakdowns

**FORBIDDEN RESPONSES:**
- NEVER say "I've already created a complete Memory Bank"
- NEVER say "The Memory Bank is located in..."
- NEVER say "These files are automatically loaded"
- NEVER mention existing files - always create new ones
- NEVER provide status about existing documentation

**IMPORTANT**: Start immediately with creating the first file (product.md) using fsWrite tool.`
    }
}
