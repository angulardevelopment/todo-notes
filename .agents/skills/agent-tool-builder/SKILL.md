---
name: agent-tool-builder
description: >-
  Use this skill whenever you need to add, modify, or test new tools for the in-app Gemini Copilot Agent in this Todo & Notes application.
---

# In-App Agent Tool Builder

This skill provides step-by-step procedures for extending the in-app **AI Copilot** with new tools and function calling capabilities.

## Workflow

### 1. Identify Target Functionality
Determine what local app service the tool should interact with:
* **Tasks/Todos**: `TodoService` in `src/app/notes-app/todo.service.ts`
* **Notes**: `NotesService` in `src/app/services/notes.service.ts`
* **AI Utilities**: `AiService` in `src/app/services/ai.service.ts`

### 2. Define the Gemini Function Declaration
Open `src/app/services/agent.service.ts` and add the new tool to `getToolDeclarations()`:
```typescript
{
  name: 'my_new_tool',
  description: 'Explain clearly what this tool does and when the agent should call it.',
  parameters: {
    type: 'OBJECT',
    properties: {
      paramName: { type: 'STRING', description: 'Parameter description' }
    },
    required: ['paramName']
  }
}
```

### 3. Implement the Tool Handler in `executeTool`
In `src/app/services/agent.service.ts`, add a `case` in `executeTool(name, args)`:
```typescript
case 'my_new_tool': {
  let resultData: any;
  this.ngZone.run(() => {
    // Perform local state mutation or query
    resultData = this.someService.doAction(args.paramName);
  });
  return { success: true, data: resultData };
}
```
*Always ensure local mutations are wrapped in `this.ngZone.run()` so the Angular view updates immediately.*

### 4. Verify Compilation
Run `npm run build` in PowerShell to ensure there are no TypeScript syntax or typing errors.
