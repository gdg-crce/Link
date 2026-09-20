import test from "node:test";
import assert from "node:assert/strict";

// We can import our compiled or TypeScript modules via dynamic import with ts-node or plain test functions
import { validateSlug, validateDestinationUrl, RESERVED_SLUGS } from "../src/lib/validation.ts";
import { parseDeviceType, isExpired, hashIp } from "../src/lib/utils.ts";

test("Slug Validation", async (t) => {
  await t.test("accepts valid alphanumeric slugs and hyphens/underscores", () => {
    const res = validateSlug("submission");
    assert.equal(res.valid, true);
    assert.equal(res.cleanSlug, "submission");

    const res2 = validateSlug("BitNBuild-2026_v2");
    assert.equal(res2.valid, true);
    assert.equal(res2.cleanSlug, "bitnbuild-2026_v2");
  });

  await t.test("rejects slugs shorter than 2 characters", () => {
    const res = validateSlug("a");
    assert.equal(res.valid, false);
    assert.match(res.error, /at least 2 characters/i);
  });

  await t.test("rejects slugs with invalid characters or spaces", () => {
    const res1 = validateSlug("hello world");
    assert.equal(res1.valid, false);

    const res2 = validateSlug("sub/mission");
    assert.equal(res2.valid, false);

    const res3 = validateSlug("../escape");
    assert.equal(res3.valid, false);
  });

  await t.test("rejects reserved system routes", () => {
    assert.equal(validateSlug("admin").valid, false);
    assert.equal(validateSlug("api").valid, false);
    assert.equal(validateSlug("login").valid, false);
    assert.equal(validateSlug("robots.txt").valid, false);
  });
});

test("Destination URL Validation", async (t) => {
  await t.test("accepts valid HTTPS and HTTP URLs", () => {
    const res1 = validateDestinationUrl("https://forms.google.com/test-form");
    assert.equal(res1.valid, true);

    const res2 = validateDestinationUrl("http://crce.ac.in");
    assert.equal(res2.valid, true);
  });

  await t.test("rejects malformed URLs", () => {
    const res = validateDestinationUrl("not-a-valid-url");
    assert.equal(res.valid, false);
  });

  await t.test("rejects dangerous URI schemes (open redirect / XSS protection)", () => {
    const res1 = validateDestinationUrl("javascript:alert(1)");
    assert.equal(res1.valid, false);

    const res2 = validateDestinationUrl("data:text/html,<h1>PWNED</h1>");
    assert.equal(res2.valid, false);
  });
});

test("Device and Privacy Utilities", async (t) => {
  await t.test("detects mobile devices from user-agent", () => {
    const iphoneUa = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148";
    assert.equal(parseDeviceType(iphoneUa), "Mobile");
  });

  await t.test("detects tablet devices from user-agent", () => {
    const ipadUa = "Mozilla/5.0 (iPad; CPU OS 13_3 like Mac OS X) AppleWebKit/605.1.15";
    assert.equal(parseDeviceType(ipadUa), "Tablet");
  });

  await t.test("detects desktop devices from user-agent", () => {
    const desktopUa = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
    assert.equal(parseDeviceType(desktopUa), "Desktop");
  });

  await t.test("detects web crawlers and search bots", () => {
    const botUa = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    assert.equal(parseDeviceType(botUa), "Bot");
  });

  await t.test("anonymizes IP addresses via hashIp", () => {
    const ip = "192.168.1.100";
    const hash = hashIp(ip);
    assert.ok(hash);
    assert.notEqual(hash, ip);
    assert.equal(hash?.length, 16);
  });

  await t.test("checks expiration accurately", () => {
    const past = new Date(Date.now() - 100000).toISOString();
    const future = new Date(Date.now() + 100000).toISOString();
    assert.equal(isExpired(past), true);
    assert.equal(isExpired(future), false);
    assert.equal(isExpired(null), false);
  });
});
