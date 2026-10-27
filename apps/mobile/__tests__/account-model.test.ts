import { DELETE_PHRASE, describeDevice, formatSessionDate, initials, matchesDeletePhrase, slugify, validateDisplayName, validateSlug } from "@/lib/account/model";

describe("initials", () => {
  it("takes the first two letters of the name, as the design shows", () => {
    expect(initials("Chidananda Reddy Jonnala", "a@b.co")).toBe("CH");
    expect(initials("  asha ", "a@b.co")).toBe("AS");
    expect(initials("X", "a@b.co")).toBe("X");
  });
  it("falls back to the email, then a question mark", () => {
    expect(initials("", "zed@example.com")).toBe("ZE");
    expect(initials(" ", " ")).toBe("?");
  });
});

describe("validateDisplayName", () => {
  it("needs a name of at most 32 characters", () => {
    expect(validateDisplayName("  ")).toBe("Enter your name.");
    expect(validateDisplayName("a".repeat(33))).toBe("Use 32 characters at most.");
    expect(validateDisplayName("a".repeat(32))).toBeNull();
  });
});

describe("slugify and validateSlug", () => {
  it("makes a url-safe handle", () => {
    expect(slugify("  Acme Capital, Ltd.! ")).toBe("acme-capital-ltd");
    expect(slugify("Café Déjà")).toBe("cafe-deja");
    expect(slugify("---")).toBe("");
  });
  it("accepts only lowercase words joined by single dashes", () => {
    expect(validateSlug("acme-capital")).toBeNull();
    expect(validateSlug("")).toBe("Enter a slug.");
    expect(validateSlug("Acme")).toBe("Use lowercase letters, numbers and dashes.");
    expect(validateSlug("acme-")).toBe("Use lowercase letters, numbers and dashes.");
    expect(validateSlug("a--b")).toBe("Use lowercase letters, numbers and dashes.");
  });
});

describe("describeDevice", () => {
  it.each([
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit Safari/604.1", "iPhone · Safari"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64) Chrome/130.0 Safari/537.36 Edg/130.0", "Windows · Edge"],
    ["Mozilla/5.0 (X11; Linux x86_64) Firefox/131.0", "Linux · Firefox"],
    ["okhttp/4.12", "OptionPilot app"],
    [null, "Unknown device"],
    ["curl", "Unknown device"],
  ])("labels %s as %s", (agent, label) => expect(describeDevice(agent)).toBe(label));
});

describe("formatSessionDate", () => {
  it("formats an ISO date and tolerates junk", () => {
    expect(formatSessionDate("2026-10-26T12:00:00.000Z")).toMatch(/^\d{1,2} Oct 2026$/);
    expect(formatSessionDate("nope")).toBe("");
    expect(formatSessionDate(null)).toBe("");
  });
});

describe("delete confirmation phrase", () => {
  it("needs the exact word in capitals, ignoring surrounding spaces", () => {
    expect(DELETE_PHRASE).toBe("DELETE");
    expect(matchesDeletePhrase(" DELETE ")).toBe(true);
    expect(matchesDeletePhrase("delete")).toBe(false);
    expect(matchesDeletePhrase("DELET")).toBe(false);
    expect(matchesDeletePhrase("")).toBe(false);
  });
});
