/**
 * Seed: system roles/permissions, configurable lookups, placeholder firm settings,
 * and clearly-marked DEMO accounts. Idempotent — safe to run repeatedly.
 *
 * Demo account password comes from DEMO_PASSWORD in .env (never hard-coded here).
 * Firm details are deliberately generic placeholders: replace them in Admin → Settings.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
import { PrismaClient } from "../src/generated/prisma/client";
import { PERMISSIONS, DEFAULT_ROLE_GRANTS, ROLE_KEYS, ROLE_LABELS } from "../src/server/auth/permissions";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });

async function seedAccess() {
  for (const [key, description] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
  }
  const perms = await db.permission.findMany();
  const byKey = new Map(perms.map((p) => [p.key, p.id]));

  for (const key of ROLE_KEYS) {
    const role = await db.role.upsert({
      where: { key },
      update: {},
      create: { key, name: ROLE_LABELS[key], isSystem: true },
    });
    // Grants are only created if missing, so admin customisations are preserved.
    for (const p of DEFAULT_ROLE_GRANTS[key]) {
      await db.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: byKey.get(p)! } },
        update: {},
        create: { roleId: role.id, permissionId: byKey.get(p)! },
      });
    }
  }
}

async function seedLookups() {
  const statuses: [string, string, boolean, boolean][] = [
    ["New", "info", false, false],
    ["Active", "success", false, false],
    ["Pending", "neutral", false, false],
    ["Hearing Scheduled", "navy", false, false],
    ["Awaiting Documents", "warning", false, false],
    ["Awaiting Client", "warning", false, false],
    ["Judgment Reserved", "brass", false, false],
    ["Disposed", "neutral", true, false],
    ["Closed", "neutral", true, false],
    ["Archived", "neutral", true, true],
  ];
  for (const [i, [name, color, isClosed, isArchived]] of statuses.entries()) {
    await db.caseStatus.upsert({ where: { name }, update: {}, create: { name, color, isClosed, isArchived, sortOrder: i } });
  }

  const caseTypes = ["Civil Suit", "Criminal Case", "Family / Matrimonial", "Property Dispute", "Corporate", "Commercial Dispute", "Consumer Complaint", "Employment", "Writ Petition", "Arbitration", "Appeal", "Other"];
  for (const [i, name] of caseTypes.entries()) {
    await db.caseType.upsert({ where: { name }, update: {}, create: { name, sortOrder: i } });
  }

  const hearingTypes = ["First Hearing", "Admission", "Evidence", "Cross-Examination", "Arguments", "Interim Application", "Orders", "Judgment", "Mediation", "Mention", "Other"];
  for (const [i, name] of hearingTypes.entries()) {
    await db.hearingType.upsert({ where: { name }, update: {}, create: { name, sortOrder: i } });
  }

  const areas: [string, string][] = [
    ["Civil Litigation", "Suits, injunctions, recovery and civil appeals."],
    ["Criminal Law", "Bail, trials, quashing petitions and criminal appeals."],
    ["Family Law", "Divorce, custody, maintenance and succession matters."],
    ["Property Law", "Title disputes, partition, conveyancing and tenancy."],
    ["Corporate Law", "Company formation, compliance and contracts."],
    ["Commercial Disputes", "Contract enforcement, recovery and arbitration."],
    ["Consumer Matters", "Complaints before consumer commissions."],
    ["Employment Matters", "Termination, wages, workplace and service disputes."],
  ];
  for (const [i, [name, description]] of areas.entries()) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    await db.practiceArea.upsert({ where: { name }, update: {}, create: { name, slug, description, sortOrder: i } });
  }
}

async function seedSettings() {
  await db.firmSettings.upsert({
    where: { id: "firm" },
    update: {},
    create: {
      id: "firm",
      // Placeholders — replace in Admin → Settings. Nothing here is a real firm.
      firmName: "Your Law Firm",
      tagline: "Modern Legal Practice. Organized. Secure. Intelligent.",
      email: "office@example.com",
      phone: "+91 00000 00000",
      addressLine1: "Office address line 1",
      city: "City",
      state: "State",
      country: "India",
      workingHours: [
        { day: "Monday – Friday", hours: "10:00 – 18:00" },
        { day: "Saturday", hours: "10:00 – 14:00" },
        { day: "Sunday", hours: "Closed" },
      ],
      channelsEnabled: { email: true, sms: false, whatsapp: false },
      publicContent: {
        heroSubheading:
          "We advise and represent individuals and businesses in civil, criminal, family, property and commercial matters, with clear communication at every stage.",
        whyChooseUs: [
          { title: "Clear communication", body: "You are kept informed of every hearing, filing and next step in your matter." },
          { title: "Organised case handling", body: "Deadlines, documents and hearing dates are tracked systematically for every case." },
          { title: "Confidentiality", body: "Client information and documents are stored securely with restricted access." },
          { title: "Transparent fees", body: "Fees are discussed upfront and every invoice is itemised." },
        ],
        disclaimer:
          "The information on this website is for general information only and does not constitute legal advice. Contacting the firm through this website does not create a lawyer–client relationship.",
      },
    },
  });
}

async function seedDemoUsers() {
  const password = process.env.DEMO_PASSWORD;
  if (!password) {
    console.warn("DEMO_PASSWORD not set — skipping demo accounts.");
    return;
  }
  const passwordHash = await hash(password, { memoryCost: 19456, timeCost: 2, parallelism: 1 });
  const roles = Object.fromEntries((await db.role.findMany()).map((r) => [r.key, r.id]));

  const staff = [
    { email: "admin@demo.legaldesk.test", name: "Demo Administrator", role: "SUPER_ADMIN", designation: "Firm Administrator" },
    { email: "lawyer@demo.legaldesk.test", name: "Ananya Rao (Demo)", role: "LAWYER", designation: "Senior Associate" },
    { email: "lawyer2@demo.legaldesk.test", name: "Vikram Menon (Demo)", role: "LAWYER", designation: "Associate" },
    { email: "staff@demo.legaldesk.test", name: "Priya Nair (Demo)", role: "STAFF", designation: "Legal Assistant" },
    { email: "accounts@demo.legaldesk.test", name: "Rahul Shetty (Demo)", role: "ACCOUNTANT", designation: "Accounts" },
  ];
  for (const u of staff) {
    await db.user.upsert({
      where: { email: u.email },
      update: {},
      create: { email: u.email, name: u.name, designation: u.designation, roleId: roles[u.role], passwordHash, isDemo: true },
    });
  }
}

async function main() {
  await seedAccess();
  await seedLookups();
  await seedSettings();
  await seedDemoUsers();
  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
