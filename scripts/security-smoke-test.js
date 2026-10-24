// Lightweight unauthenticated-route smoke test; not a full security audit.
const base = process.env.APP_URL || "http://localhost:3000";
(async () => {
  const routes = [
    "/api/business/1",
    "/api/summary/1",
    "/api/suppliers/1",
    "/api/supplier-bills/1",
    "/api/inventory/1",
    "/api/cashflow/1"
  ];
  let failed = false;
  for (const route of routes) {
    try {
      const response = await fetch(base + route, { redirect: "manual" });
      if (response.status !== 401) {
        failed = true;
        console.error(`FAIL ${route}: expected 401, got ${response.status}`);
      } else console.log(`PASS ${route}: unauthenticated request rejected`);
    } catch (error) {
      failed = true;
      console.error(`ERROR ${route}: ${error.message}`);
    }
  }
  if (failed) process.exitCode = 1;
  else console.log("Unauthenticated smoke tests passed. Run authenticated two-user isolation tests manually.");
})();
