/**
 * Centralized prompts for Memory Bank generation
 */

export class MemoryBankPrompts {
    /**
     * PROMPT: First 3 Memory Bank files creation (product.md, structure.md, tech.md)
     */
    static getFirst3FilesPrompt(): string {
        return `I'll create the first 3 Memory Bank files for this project by analyzing the codebase structure.

**Creating Memory Bank Directory Structure**
First, I'll create the .amazonq/rules/memory-bank/ directory to store the documentation files.

**Analyzing Project Structure and Configuration**
I'll explore the project structure using listDirectory and readFile tools to understand:
- Project purpose, features, and key capabilities
- Technology stack, build systems, and development workflows  
- Directory organization and architectural patterns

**Important: I will only use listDirectory and readFile tools. I will NOT use executeBash or shell commands for analysis.**

**Creating product.md - Project overview, purpose, and key features**
I'll analyze the project structure and create product.md with:
- Project purpose and core value proposition
- Key features and capabilities
- Target users and use cases
- Technical architecture overview

**Creating structure.md - Project organization, directory structure, and architecture patterns**  
I'll analyze the directory structure and create structure.md with:
- Complete directory structure with explanations
- Core components and their relationships
- Architectural patterns and design principles
- Data models and extension points

**Creating tech.md - Technology stack, build systems, frameworks, and common commands**
I'll analyze the technology stack and create tech.md with:
- Programming languages and versions
- Build systems and package management
- Key dependencies and frameworks
- Development and deployment commands
- Integration technologies

**Next Steps**
After creating these 3 files, I'll provide instructions for generating guidelines.md using the science pipeline methodology.

Let me begin creating these 3 Memory Bank files now.

**After completing the first 3 files, I'll tell the user:**
"✅ The first 3 Memory Bank files have been created successfully!

📋 **Files Created:**
- product.md: Project overview and key features
- structure.md: Directory organization and architecture  
- tech.md: Technology stack and development commands

🔬 **Next: Guidelines Generation**
The system will now automatically generate guidelines.md using the science pipeline methodology. This involves:
1. Analyzing all source files for lexical patterns
2. Ranking files by importance using LLM
3. Iteratively building coding standards from the most representative files

Please wait while the science pipeline completes..."

This will trigger the automatic guidelines.md generation process.`
    }

    /**
     * PROMPT 2: File ranking prompt - EXACT copy from science document
     * This is the rank_with_llm() step
     */
    static getFileRankingPrompt(filesString: string, numberToExtract: number): string {
        return `I will provide a list of files and the number of lines each file has.

Please output just a JSON list which contains exactly ${numberToExtract} of these absolute file paths which are the most important and representative of this list to mine. Copy the exact filepaths exactly as they appear from the input.

Consider the following when curating this list:
- The file path: contains information about what type of file it is (src, test)
- The file path: contains semantic information about the responsibilities of the class (e.g., core logic, utilities, subsystem)
- The number of lines of code: indicates the size of code within the files
- The mean lexical dissimilarity score: a higher number indicates this file is more different and unique from the other files in the project and thus might provide more information

The expected format is ["filename1"\\n, "filename2"\\n, "filename3", ...]

ONLY PROVIDE THE REQUESTED JSON AND NO OTHER TEXT

Do not:
- Provide any textual response besides the requested JSON
- Use any markdown tags to annotate your response

<list>
${filesString}
</list>`
    }

    /**
     * PROMPT 3: Iterative style guide generation prompt - EXACT copy from science document
     * This is the generate_style_guide() step
     */
    static getIterativeStyleGuidePrompt(chunkFiles: string[], totalFiles: number, currentStyleGuide?: string): string {
        const workspace = chunkFiles.join('\n---\n')

        let prompt = `\\ Number of files in this iteration: ${chunkFiles.length} out of ${totalFiles}
<uploaded_files>
${workspace}
</uploaded_files>

I've uploaded files from a codebase above. Please analyze these and create a comprehensive documentation file with the following structure:

1. Code Quality Standards Analysis
- Document commonly used code formatting patterns
- Identify structural conventions (common language feature structural patterns) and specifically identify what they are. Do not just list off best practices, instead list specifically what this code base adheres to.
- Note textual standards (naming, documentation, etc.) and specifically list what they are
- Practices followed throughout the codebase in all areas of the software development lifecycle

2. Semantic Patterns Overview
- List recurring implementation patterns
- Document common architectural approaches
- Highlight frequent design patterns
- Proper internal API usage and patterns (with code examples!)
- Frequently used code idioms
- Popular annotations

Important Notes:
- If there is not a document already started at the end of this prompt, please begin it. Otherwise, edit it accordingly to the frequent patterns emerging in the new code presented above and output the next iteration of the document. 
- Consider both application-specific and general programming patterns
- Do not output any other textual response describing the file you are creating. Only output the file contents itself
- Use markdown formatting for the document
- Keep track of how many files you looked at actually have the qualities described per each quality. This will provide an idea to the frequency of patterns in the codebase. Update this number with every iteration.
- Do not just give notes or edits for the document, instead just provide the editted document itself.
- Do not track antipatterns or note inconsistencies (such as inconsistent use of documentation)`

        if (currentStyleGuide) {
            prompt += `\n\nCurrent q-code-formats.md content:\n\n${currentStyleGuide}`
        }

        return prompt
    }
}
