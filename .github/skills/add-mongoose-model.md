# Add Mongoose Model Skill

## Trigger
`/add-mongoose-model <ModelName>`

## What It Does
Creates a properly typed Mongoose model file with interface, schema, indexes, timestamps, and toJSON transform.

## Output File
`server/src/models/<ModelName>.model.ts`

## Template
```typescript
import mongoose, { Document, Schema } from "mongoose";

export interface I<ModelName> extends Document {
  userId: mongoose.Types.ObjectId;
  // Add fields
  createdAt: Date;
  updatedAt: Date;
}

const <modelName>Schema = new Schema<I<ModelName>>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Add fields
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc: any, ret: Record<string, any>) {
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Add indexes
<modelName>Schema.index({ userId: 1, createdAt: -1 });

export const <ModelName> = mongoose.model<I<ModelName>>("<ModelName>", <modelName>Schema);
```

## Rules
- Always include `userId` reference for user-scoped data
- Use `timestamps: true` for automatic createdAt/updatedAt
- Add compound indexes on commonly queried field combinations
- Use `select: false` for sensitive fields
- Document all interfaces with JSDoc comments
