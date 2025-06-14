// convex/prosemirror.ts
import { components } from './_generated/api';
import { ProsemirrorSync } from '@convex-dev/prosemirror-sync';
import { DataModel } from './_generated/dataModel';
import { GenericMutationCtx, GenericQueryCtx } from 'convex/server';
import { getAuthUserId } from "@convex-dev/auth/server";

// Basic permission check: ensure user is logged in.
// You might want to add more specific checks, e.g., if a user can access a specific document.
async function checkPermissions(ctx: GenericQueryCtx<DataModel> | GenericMutationCtx<DataModel>, _id: string) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new Error("User must be logged in to access/edit documents.");
  }
  // Example: Check if user has rights to a document (if you store document ownership)
  // const docInfo = await ctx.db.query("my_document_permissions").withIndex("by_docId_and_userId", q => q.eq("docId", id).eq("userId", userId)).first();
  // if (!docInfo) {
  //   throw new Error("User not authorized for this document.");
  // }
}

const prosemirrorSync = new ProsemirrorSync(components.prosemirrorSync);

export const { getSnapshot, submitSnapshot, latestVersion, getSteps, submitSteps } = prosemirrorSync.syncApi<DataModel>({
  checkRead: checkPermissions,
  checkWrite: checkPermissions,
  // onSnapshot: async (ctx, id, snapshot, version) => {
  //   // Optional: Do something when a new snapshot is saved, e.g., update a search index.
  //   console.log(`New snapshot for doc ${id} (version ${version}): ${snapshot}`);
  // },
});

// Function to create a new ProseMirror document (e.g., for a candidate description)
// You would call this from another mutation, for example, when creating a new candidate.
// import { internalMutation } from "./_generated/server";
// import { v } from "convex/values";
// export const createNewDocument = internalMutation({
//   args: { initialContentJSON: v.string() }, // ProseMirror JSON content as a string
//   handler: async (ctx, args) => {
//     const newDocId = await prosemirrorSync.create(ctx, args.initialContentJSON);
//     return newDocId;
//   },
// });
