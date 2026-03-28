"use client";

// A custom error class for Firestore permission issues.
export class FirestorePermissionError extends Error {
  context: Record<string, any>;

  constructor(message: string, context: Record<string, any> = {}) {
    super(message);
    this.name = "FirestorePermissionError";
    this.context = context;
    Object.setPrototypeOf(this, FirestorePermissionError.prototype);
  }
}

export class FirestoreQuotaError extends Error {
  constructor(message: string = "Le quota de requêtes Firestore a été dépassé. Veuillez réessayer plus tard.") {
    super(message);
    this.name = "FirestoreQuotaError";
    Object.setPrototypeOf(this, FirestoreQuotaError.prototype);
  }
}

export class FirestoreTimeoutError extends Error {
  constructor(message: string = "La requête a pris trop de temps. Vérifiez votre connexion.") {
    super(message);
    this.name = "FirestoreTimeoutError";
    Object.setPrototypeOf(this, FirestoreTimeoutError.prototype);
  }
}
