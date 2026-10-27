// Node's type stripper does not add .ts to extensionless ESM imports.
// @optionpilot/shared's barrel uses those imports, and Next resolves them itself.
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.(?:[cm]?[jt]s|json)$/.test(specifier)
  ) {
    try {
      return await nextResolve(`${specifier}.ts`, context);
    } catch {
      return nextResolve(`${specifier}/index.ts`, context);
    }
  }
  return nextResolve(specifier, context);
}
