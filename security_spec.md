# Security Specification - VendaMax

## Data Invariants
- Each document must belong to a specific user identified by `userId`.
- Users can only read, create, update, or delete their own documents.
- `userId` field is immutable once set.
- All monetary values must be non-negative.

## The "Dirty Dozen" Payloads (Denial Expected)
1. Creating a product with someone else's `userId`.
2. Reading an order belonging to another user.
3. Updating the `userId` of a client to transfer it to another user.
4. Patching an order total without being the owner.
5. Deleting a transaction belonging to another user.
6. Creating a receivable with a negative amount.
7. Listing products without providing a `userId` filter (though rules should stop it anyway).
8. Injecting a 2MB string into a product description.
9. Updating `createdAt` or similar immutable fields (if applicable).
10. Anonymous users trying to write data.
11. Spoofing `userId` in the payload to match someone else's UID.
12. Creating a document in a non-existent collection.

## Test Runner
A `firestore.rules.test.ts` will be created later to verify these.
