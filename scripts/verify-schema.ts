import { z } from "zod";
import { ItemSchema } from "../src/types/schema";

console.log("Starting Verification Draft...");

// Test Case 1: Valid Item
const validItem = {
    name: "Test Item",
    type: "Cable",
    specs: { length: "1m", interface: "USB-C" },
    status: "Available"
};

const result1 = ItemSchema.safeParse(validItem);
if (result1.success) {
    console.log("✅ Test Case 1 (Valid Item): PASSED");
} else {
    console.error("❌ Test Case 1 (Valid Item): FAILED", result1.error);
}

// Test Case 2: Invalid JSON in specs (Simulated by passing non-record if possible, but schema expects record)
// Since we changed specs to z.record(), passing a string should fail now, which is GOOD.
const invalidSpecsItem = {
    name: "Bad Specs Item",
    specs: "This is a string not a record"
};

const result2 = ItemSchema.safeParse(invalidSpecsItem);
if (!result2.success) {
    console.log("✅ Test Case 2 (Invalid Specs Type): PASSED (Correctly rejected)");
} else {
    console.error("❌ Test Case 2 (Invalid Specs Type): FAILED (Should have rejected)");
}

// Test Case 3: Missing Required Name
const missingNameItem = {
    type: "Charger"
};

const result3 = ItemSchema.safeParse(missingNameItem);
if (!result3.success) {
    console.log("✅ Test Case 3 (Missing Name): PASSED (Correctly rejected)");
} else {
    console.error("❌ Test Case 3 (Missing Name): FAILED (Should have rejected)");
}

console.log("Verification Complete.");
