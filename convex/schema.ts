import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

const applicationTables = {
  voters: defineTable({
    userId: v.id("users"), // Links to the users table in authTables
    voterId: v.string(), // The unique public voter ID
    officialName: v.string(),
    phoneNumber: v.string(),
    isAdmin: v.boolean(),
  })
    .index("by_userId", ["userId"]) 
    .index("by_voterId", ["voterId"]),

  candidates: defineTable({
    name: v.string(),
    description: v.optional(v.string()), // Simple text description for now
    imageUrl: v.optional(v.string()),
  }),

  votes: defineTable({
    userId: v.id("users"), 
    candidateId: v.id("candidates"), 
  })
    .index("by_userId", ["userId"]) 
    .index("by_candidateId", ["candidateId"]),
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
