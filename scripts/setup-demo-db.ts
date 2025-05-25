import { db } from "../server/db";
import { users, passwords, settings } from "../shared/schema";

async function seedDatabase() {
  console.log("Setting up demo data...");

  // Create a demo user
  const [demoUser] = await db
    .insert(users)
    .values({
      username: "demo",
      password: "password",
      email: "demo@example.com",
    })
    .returning()
    .onConflictDoNothing();

  if (!demoUser) {
    console.log("Demo user already exists, skipping user creation");
    return;
  }

  console.log("Created demo user:", demoUser.username);

  // Create some demo passwords
  const websites = ["example.com", "gmail.com", "amazon.com", "netflix.com"];
  for (const website of websites) {
    const [password] = await db
      .insert(passwords)
      .values({
        userId: demoUser.id,
        website,
        username: website === "amazon.com" ? "johndoe22" : "john.doe@email.com",
        password: `Secure${website.charAt(0).toUpperCase()}@ssw0rd`,
      })
      .returning();

    console.log(`Created password for ${website}`);
  }

  // Create demo settings
  const [demoSettings] = await db
    .insert(settings)
    .values({
      userId: demoUser.id,
      extensionSettings: {
        autoFillOnPageLoad: true,
        autoLockTimeout: "15",
        biometricAuth: true,
        passwordSuggestions: true,
        defaultPasswordLength: "16",
      },
      syncSettings: {
        syncWithNativeApp: true,
        syncFrequency: "realtime",
        lastSynced: new Date().toISOString(),
      },
    })
    .returning();

  console.log("Created demo settings");
  console.log("Database setup complete!");
}

seedDatabase()
  .catch(console.error)
  .finally(() => process.exit());