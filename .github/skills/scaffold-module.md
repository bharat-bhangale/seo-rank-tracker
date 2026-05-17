# Scaffold Module Skill

## Trigger
`/scaffold-module <module-name>`

## What It Does
Creates a complete feature module with 4 files following the project pattern.

## Output Files
```
server/src/modules/<module-name>/
├── <module-name>.validation.ts
├── <module-name>.service.ts
├── <module-name>.controller.ts
└── <module-name>.routes.ts
```

## Template: validation.ts
```typescript
import { z } from "zod";

export const create<Module>Schema = z.object({
  // Define fields
});

export type Create<Module>Input = z.infer<typeof create<Module>Schema>;
```

## Template: service.ts
```typescript
import { AppError } from "../../utils/AppError";
import type { Create<Module>Input } from "./<module-name>.validation";

export const create<Module> = async (userId: string, input: Create<Module>Input) => {
  // Business logic
};
```

## Template: controller.ts
```typescript
import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/response";
import * as <module>Service from "./<module-name>.service";

export const create<Module> = asyncHandler(async (req: Request, res: Response) => {
  const result = await <module>Service.create<Module>(req.user!.id, req.body);
  sendSuccess(res, result, 201);
});
```

## Template: routes.ts
```typescript
import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { validate } from "../../middleware/validate.middleware";
import * as controller from "./<module-name>.controller";
import { create<Module>Schema } from "./<module-name>.validation";

const router = Router();
router.use(authenticate);
router.post("/", validate(create<Module>Schema), controller.create<Module>);
export default router;
```
