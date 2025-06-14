"use convex"; 

import { v } from "convex/values";
import { mutation, query } from "./_generated/server"; // Removed internalMutation as it's not used yet
import { getAuthUserId } from "@convex-dev/auth/server";
// import { api, internal } from "./_generated/api"; // Not strictly needed for current functions
import { Id } from "./_generated/dataModel";

async function ensureAdmin(ctx: any) { 
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("Authentication required.");
  }
  const voterProfile = await ctx.db
    .query("voters")
    .withIndex("by_userId", (q: any) => q.eq("userId", userId))
    .unique();
  if (!voterProfile?.isAdmin) {
    throw new Error("Admin privileges required.");
  }
  return userId;
}

export const addCandidate = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()), 
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);

    const candidateId = await ctx.db.insert("candidates", {
      name: args.name,
      description: args.description, 
      imageUrl: args.imageUrl,
    });
    return candidateId;
  },
});

export const updateCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    const { candidateId, ...updates } = args;
    
    const validUpdates: Partial<typeof updates> = {};
    if (updates.name !== undefined) validUpdates.name = updates.name;
    if (updates.description !== undefined) validUpdates.description = updates.description;
    if (updates.imageUrl !== undefined) validUpdates.imageUrl = updates.imageUrl;

    await ctx.db.patch(candidateId, validUpdates as any); 
    return { success: true };
  },
});

export const deleteCandidate = mutation({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    await ensureAdmin(ctx);
    
    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found.");
    }

    const votesToDelete = await ctx.db
      .query("votes")
      .withIndex("by_candidateId", (q) => q.eq("candidateId", args.candidateId))
      .collect();
    
    for (const vote of votesToDelete) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(args.candidateId);
    return { success: true };
  },
});

export const listCandidates = query({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").order("asc").collect();
    return candidates.map(candidate => ({
      ...candidate,
      // No special description handling needed for simple text
    }));
  },
});

export const castVote = mutation({
  args: {
    candidateId: v.id("candidates"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to vote.");
    }

    const voterProfile = await ctx.db
      .query("voters")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .unique();
    if (!voterProfile) {
      throw new Error("Voter profile not found. Please complete your profile.");
    }

    const candidate = await ctx.db.get(args.candidateId);
    if (!candidate) {
      throw new Error("Candidate not found.");
    }

    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    
    if (existingVote) {
      throw new Error("You have already cast your vote in this election.");
    }

    await ctx.db.insert("votes", {
      userId,
      candidateId: args.candidateId,
    });

    return { success: true, message: "Vote cast successfully!" };
  },
});

export const getVoteCounts = query({
  args: {},
  handler: async (ctx) => {
    const candidates = await ctx.db.query("candidates").collect();
    const voteCounts: Record<Id<"candidates">, { name: string, count: number, imageUrl?: string, description?: string }> = {};

    for (const candidate of candidates) {
      const votesForCandidate = await ctx.db
        .query("votes")
        .withIndex("by_candidateId", (q) => q.eq("candidateId", candidate._id))
        .collect();
      
      voteCounts[candidate._id] = {
        name: candidate.name,
        count: votesForCandidate.length,
        imageUrl: candidate.imageUrl,
        description: candidate.description
      };
    }
    return voteCounts;
  },
});

export const hasVoted = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false; 
    }
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    return !!existingVote;
  }
});
