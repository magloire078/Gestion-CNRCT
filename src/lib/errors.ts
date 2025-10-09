"use client";

// A custom error class for Firestore permission issues.
export class FirestorePermissionError extends Error {
  context: Record<string, any>;

  constructor(message: string, context: Record<string, any> = {}) {
    super(message);
    this.name = "FirestorePermissionError";
    this.context = context;
    
    // This is to ensure the prototype chain is correctly set up.
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}
