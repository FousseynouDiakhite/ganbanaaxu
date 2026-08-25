import {ClerkExpressWithAuth} from "@clerk/clerk-sdk-node";

export const requireClerkAuth =
 new ClerkExpressWithAuth();
// ✅ ESLint-compliant
