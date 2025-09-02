/**
 * Centralized prompts for Memory Bank generation following the exact science approach
 */

export class MemoryBankPrompts {
    /**
     * Main prompt for memory bank creation that transforms user request into comprehensive agent prompt
     * Following the exact approach from the product and science documents
     */
    static getMemoryBankCreationPrompt(): string {
        return `I need you to create a comprehensive Memory Bank for this project by analyzing the codebase and generating 4 documentation files. This Memory Bank will provide persistent project context for all future AI conversations.

**Your Task:**
Create 4 markdown files in the .amazonq/rules/memory-bank/ directory:

1. **product.md** - Contains a concise overview of the product, its purpose, and key features
2. **structure.md** - Comprehensive information about the project's organization, directory structures and its contents, and architecture patterns  
3. **tech.md** - Details the technology stack used including programming languages, build systems, key dependencies, common commands, environment setup, development workflows, and testing guidelines
4. **guidelines.md** - Describes the coding best practices adhered to in the codebase and organizes frequent semantic code patterns discovered

**Analysis Process:**

**Step 1: Project Discovery (for product.md, structure.md, tech.md)**
- Use list_directory tool to explore the project structure recursively
- Identify key directories, file types, and organizational patterns
- Count total files and analyze project size
- Read common configuration and documentation files you discover such as:
  - Documentation: README.md, README.rst, README.txt, CHANGELOG.md
  - Package managers: package.json, requirements.txt, pom.xml, Cargo.toml, go.mod, composer.json, Gemfile
  - Build configs: webpack.config.js, vite.config.js, build.gradle, Makefile, CMakeLists.txt, setup.py
  - Language configs: tsconfig.json, .eslintrc, pyproject.toml, .rubocop.yml, .editorconfig
  - Environment: .env files, docker-compose.yml, Dockerfile
- Analyze .gitignore and other development configuration files you find

**Step 2: Pipeline-Based Guidelines Generation (for guidelines.md)**
For guidelines.md, use this specific pipeline approach:

1. **File Statistics Collection**: Gather statistics for each file:
   - File Path (semantic information about responsibilities)
   - Line Count (indicates code quantity and complexity)
   - File Type (extension and category)

2. **File Ranking**: Select the top 15 most important and representative files by:
   - Prioritizing files with higher line counts and semantic importance
   - Filtering out test files, config files, and inappropriate sizes
   - Focusing on core logic files vs utilities vs tests
   - Consider file path semantics for importance

3. **Pattern Extraction**: Process selected files in batches to extract:
   - **Import patterns**: module usage, dependency patterns
   - **Declaration patterns**: class definitions, interface definitions, type definitions
   - **Function patterns**: async functions, arrow functions, method signatures
   - **Annotation patterns**: decorators, framework-specific annotations
   - **Error handling patterns**: try/catch usage, exception types

4. **Pattern Categorization**: Organize patterns into these categories:
   - **Existing Tool (11%)**: Patterns checkable by PMD, Checkstyle, JLinter (indentation, annotations, naming)
   - **Custom Rules (33%)**: Project-specific patterns requiring specialized analysis (internal annotations, data types)
   - **Semantic (31%)**: Context-dependent patterns requiring code understanding (method naming conventions, design patterns)
   - **Global (24%)**: Class-level and configuration patterns (package structure, class organization)

**Content Specifications:**

**For product.md:**
- Project purpose and description from README and package.json
- Key features and capabilities identified from dependencies and structure
- Target audience and use cases
- Value propositions and technology highlights
- Market positioning and competitive advantages

**For structure.md:**
- Directory hierarchy mapping with purposes
- Architectural patterns (monorepo, microservices, MVC, etc.)
- Package/workspace organization details
- Module relationships and dependencies
- File organization conventions and naming patterns

**For tech.md:**
- Programming languages and versions used
- Build systems and tooling discovered (webpack, gradle, cargo, make, etc.)
- Testing frameworks and tools found (jest, pytest, junit, rspec, etc.)
- Package managers and dependency management (npm, pip, maven, cargo, etc.)
- Key dependencies and their purposes
- Development workflows and common commands from scripts/Makefile
- Environment setup requirements
- CI/CD pipeline information from .github, .gitlab-ci.yml, etc.

**For guidelines.md:**
- Code Quality Standards Analysis with specific formatting patterns
- Structural conventions and language feature patterns
- Textual standards (naming, documentation) with specific examples
- Semantic Patterns Overview with recurring implementation patterns
- Common architectural approaches with code examples
- Frequent design patterns discovered in the codebase
- Internal API usage patterns with examples
- Error handling practices and exception patterns

**File Size Guidelines:**
- Small projects (<50 files): 100-200 lines per file
- Medium projects (50-200 files): 150-250 lines per file  
- Large projects (200+ files): 200-300 lines per file

**Output Format:**
Each file should be well-structured markdown with:
- Clear sections and subsections
- Code examples where relevant
- Specific, actionable information (not generic best practices)
- Frequency statistics for pattern prevalence in guidelines.md

**Important Requirements:** 
- Create the .amazonq/rules/memory-bank/ directory if it doesn't exist
- Use fs_write tool to create each file
- Provide progress updates as you work through each step
- Focus on codebase-specific details, not generic advice
- For guidelines.md, analyze actual code patterns, not theoretical best practices
- Include specific examples and frequency counts for discovered patterns

Begin the analysis now and create the Memory Bank files following this exact approach.`
    }

    /**
     * Prompt for analyzing project structure (agentic approach)
     */
    static getStructureAnalysisPrompt(): string {
        return `Analyze the project structure and create a comprehensive structure.md file following the memory bank specification.

Create comprehensive information about:
- Project's organization and directory structures with their contents
- Architecture patterns (monorepo, microservices, MVC, etc.)
- Package/workspace organization details
- Module relationships and dependencies
- File organization conventions and naming patterns

Use list_directory tool to explore the codebase systematically and map the hierarchy with purposes.`
    }

    /**
     * Prompt for analyzing technology stack (agentic approach)
     */
    static getTechStackAnalysisPrompt(): string {
        return `Analyze the technology stack and create a comprehensive tech.md file following the memory bank specification.

Detail the technology stack including:
- Programming languages and versions used
- Build systems and bundling tools (webpack, rollup, etc.)
- Testing frameworks and tools (jest, mocha, cypress, etc.)
- Key dependencies and their purposes
- Development workflows and common commands
- Environment setup requirements
- CI/CD pipeline information

Read configuration files like package.json, tsconfig.json, webpack.config.js, etc.`
    }

    /**
     * Pipeline-based prompt for guidelines generation following science approach
     */
    static getGuidelinesAnalysisPrompt(): string {
        return `Analyze the codebase for coding patterns and create a comprehensive guidelines.md file using the pipeline approach.

Follow this specific process:

1. **File Statistics Collection**: Gather for each file:
   - File Path (semantic information about responsibilities)
   - Line Count (indicates code quantity and complexity)
   - File Type (extension and category)

2. **File Ranking**: Select top 15 most important files by:
   - Prioritizing higher line counts and semantic importance
   - Filtering out test files, config files
   - Focusing on core logic vs utilities
   - Consider file path semantics

3. **Pattern Extraction**: Extract from selected files:
   - Import patterns (import, require, #include, use, from statements)
   - Declaration patterns (class, interface, struct, enum, function definitions)
   - Function patterns (method signatures, async patterns, naming conventions)
   - Annotation patterns (decorators, attributes, pragmas: @, #[, ///)
   - Error handling patterns (try/catch, Result types, Option types, exceptions)

4. **Pattern Categorization**: Organize into:
   - **Existing Tool (11%)**: Linter/formatter checkable (indentation, basic naming, built-in annotations)
   - **Custom Rules (33%)**: Project-specific (internal annotations, custom data types, framework patterns)
   - **Semantic (31%)**: Context-dependent (meaningful naming conventions, design patterns, architectural decisions)
   - **Global (24%)**: Module/package-level and configuration patterns

Output should describe coding best practices adhered to in the codebase and organize frequent semantic code patterns discovered with specific examples and frequency counts.`
    }

    /**
     * Prompt for product overview analysis (agentic approach)
     */
    static getProductAnalysisPrompt(): string {
        return `Analyze the project and create a comprehensive product.md file following the memory bank specification.

Create a concise overview containing:
- Product purpose and description from README and package.json
- Key features and capabilities identified from dependencies and structure
- Target audience and use cases
- Value propositions and technology highlights
- Market positioning and competitive advantages

Read README.md, package.json, and other documentation to understand the project's purpose and goals.`
    }
}
