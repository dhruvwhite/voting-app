import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api, internal } from "./_generated/api"; // Assuming api.auth.signUp exists
import { Id } from "./_generated/dataModel";

// Mutation to create a voter profile after standard signup
export const createVoterProfile = mutation({
  args: {
    voterId: v.string(),
    officialName: v.string(),
    phoneNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("User must be logged in to create a voter profile.");
    }

    // Check if this user already has a voter profile
    const existingProfileByUserId = await ctx.db
      .query("voters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    if (existingProfileByUserId) {
      throw new Error("Voter profile already exists for this user.");
    }

    // Check if the voterId is already taken
    const existingProfileByVoterId = await ctx.db
      .query("voters")
      .withIndex("by_voterId", (q) => q.eq("voterId", args.voterId))
      .first(); // Use first() instead of unique() if you just want to check existence
    if (existingProfileByVoterId) {
      throw new Error("This Voter ID is already registered.");
    }

    await ctx.db.insert("voters", {
      userId,
      voterId: args.voterId,
      officialName: args.officialName,
      phoneNumber: args.phoneNumber,
      isAdmin: false, // Default to not admin
    });

    return { success: true };
  },
});

// Query to get the current user's voter profile
export const getCurrentVoterProfile = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const voterProfile = await ctx.db
      .query("voters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return voterProfile;
  },
});

// Query to check if the current user is an admin
export const isAdmin = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return false;
    }
    const voterProfile = await ctx.db
      .query("voters")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();
    return voterProfile?.isAdmin ?? false;
  },
});

// Note: The direct registration mutation that calls api.auth.signUp and then creates a voter
// profile is tricky because api.auth.signUp (from convex/auth.ts) might not return userId directly
// or might be locked. The current approach is to sign up normally, then create a voter profile.
